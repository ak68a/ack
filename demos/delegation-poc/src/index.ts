/**
 * AgentID Delegation PoC — Full Flow
 *
 * 1. Owner registers agent on ERC-8004 (Sepolia/Tenderly)
 * 2. Owner signs a delegation claim authorizing the agent
 * 3. Delegation root hash is anchored on-chain as ERC-8004 metadata
 * 4. Server starts with MPP 402 + delegation verification
 * 5. Agent calls paid API, receives 402 challenge
 * 6. Agent pays and submits delegation proof
 * 7. Server verifies delegation + payment → access granted
 */

import { colors, log } from "@repo/cli-tools"
import { type Hex, toHex } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { callPaidApi } from "./agent-client"
import {
  addressToDid,
  createDelegationClaim,
  getDelegationRootHash,
  signDelegationClaim,
  verifyDelegationClaim,
} from "./delegation"
import { getDelegationRoot, registerAgent } from "./erc8004"
import { startServer } from "./server"

const SERVER_PORT = 3456

async function main() {
  console.clear()

  log(`
${colors.bold("AgentID Delegation PoC")}
${colors.dim("ERC-8004 + AgentID + MPP integration demo")}
`)

  // --- Step 1: Generate keys ---
  log(colors.bold("1. Generating owner and agent keypairs..."))

  const randomKey = (): Hex =>
    toHex(crypto.getRandomValues(new Uint8Array(32)))

  const ownerPrivateKey = (process.env.OWNER_PRIVATE_KEY as Hex) ?? randomKey()
  const agentPrivateKey = (process.env.AGENT_PRIVATE_KEY as Hex) ?? randomKey()

  if (!process.env.OWNER_PRIVATE_KEY) {
    log(colors.dim("   No keys in env — generating fresh keypairs"))
  }

  const ownerAccount = privateKeyToAccount(ownerPrivateKey)
  const agentAccount = privateKeyToAccount(agentPrivateKey)

  const ownerDid = addressToDid(ownerAccount.address)
  const agentDid = addressToDid(agentAccount.address)

  log(`   Owner: ${ownerAccount.address}`)
  log(`   Agent: ${agentAccount.address}`)

  // --- Step 2: Create and sign delegation ---
  log(colors.bold("\n2. Owner signs delegation claim..."))

  const claim = createDelegationClaim({
    delegatorDid: ownerDid,
    delegateDid: agentDid,
    action: "payment",
    scope: "api-access",
    maxDepth: 1,
    expiresInSeconds: 86400,
    constraints: { max_amount: "0.001", currency: "ETH" },
  })

  const signedClaim = await signDelegationClaim(claim, ownerPrivateKey)

  const localResult = await verifyDelegationClaim(signedClaim, ownerDid)
  log(
    `   ${localResult.valid ? colors.bold("Valid") : "INVALID"} — action: ${claim.action}, scope: ${claim.scope}, depth: ${claim.max_depth}`,
  )

  if (!localResult.valid) {
    log(`   Error: ${localResult.reason}`)
    process.exit(1)
  }

  // --- Step 3: Register on ERC-8004 ---
  const rootHash = getDelegationRootHash(signedClaim)
  let agentId = 0

  if (process.env.TENDERLY_RPC_URL) {
    log(colors.bold("\n3. Registering agent on ERC-8004..."))

    const { agentId: id, txHash } = await registerAgent({
      ownerPrivateKey,
      agentURI: JSON.stringify({
        name: "AgentID PoC Agent",
        description: "Demo agent with delegated payment authority",
      }),
      delegationRootHash: rootHash,
    })
    agentId = Number(id)

    log(`   Agent ID: ${agentId}`)
    log(`   Delegation root anchored on-chain`)

    // Verify round-trip
    const onChainRoot = await getDelegationRoot(BigInt(agentId))
    if (onChainRoot === rootHash) {
      log(`   ${colors.bold("On-chain root matches")}`)
    } else {
      log(`   WARNING: on-chain root mismatch`)
    }
  } else {
    log(colors.dim("\n3. Skipped ERC-8004 (no TENDERLY_RPC_URL)"))
  }

  // --- Step 4: Start server ---
  log(colors.bold("\n4. Starting API server with MPP 402 + delegation verification..."))

  await startServer({
    port: SERVER_PORT,
    serverWallet: ownerAccount.address, // server receives payment
    requiredAmount: "0.001",
    requiredAction: "payment",
    requiredScope: "api-access",
  })

  log(`   Listening on http://localhost:${SERVER_PORT}`)

  // --- Step 5: Agent calls the API ---
  log(colors.bold("\n5. Agent calls paid API..."))

  const result = await callPaidApi({
    privateKey: agentPrivateKey,
    delegation: signedClaim,
    agentId,
    serverUrl: `http://localhost:${SERVER_PORT}`,
  })

  if (result.success) {
    log(`   ${colors.bold("402 → Payment sent → 200 Access Granted")}`)
    if (result.txHash) {
      log(`   Payment tx: ${result.txHash.slice(0, 20)}...`)
    }
    log(`   Challenge: ${result.challengeId}`)
    log("")
    log(colors.dim("   Server response:"))
    log(colors.dim(`   ${JSON.stringify(result.response, null, 2).split("\n").join("\n   ")}`))

    if (result.receipt) {
      log("")
      log(colors.dim("   Payment receipt:"))
      log(colors.dim(`   ${JSON.stringify(result.receipt, null, 2).split("\n").join("\n   ")}`))
    }
  } else {
    log(`   FAILED: ${result.error}`)
  }

  // --- Step 6: Negative cases ---
  log(colors.bold("\n6. Negative cases — server rejects unauthorized agents\n"))

  // 6a: Wrong action
  log(colors.dim("   6a. Agent with wrong action (read instead of payment)..."))
  const wrongActionClaim = await signDelegationClaim(
    createDelegationClaim({
      delegatorDid: ownerDid,
      delegateDid: agentDid,
      action: "read",
      scope: "api-access",
    }),
    ownerPrivateKey,
  )

  const wrongActionResult = await callPaidApi({
    privateKey: agentPrivateKey,
    delegation: wrongActionClaim,
    agentId,
    serverUrl: `http://localhost:${SERVER_PORT}`,
    skipPayment: true,
  })
  log(
    wrongActionResult.success
      ? `   ${colors.bold("Unexpected: access granted")}`
      : `   ${colors.bold(`Rejected (${wrongActionResult.status})`)} — ${wrongActionResult.error}`,
  )

  // 6b: Wrong scope
  log(colors.dim("\n   6b. Agent with wrong scope (database instead of api-access)..."))
  const wrongScopeClaim = await signDelegationClaim(
    createDelegationClaim({
      delegatorDid: ownerDid,
      delegateDid: agentDid,
      action: "payment",
      scope: "database",
    }),
    ownerPrivateKey,
  )

  const wrongScopeResult = await callPaidApi({
    privateKey: agentPrivateKey,
    delegation: wrongScopeClaim,
    agentId,
    serverUrl: `http://localhost:${SERVER_PORT}`,
    skipPayment: true,
  })
  log(
    wrongScopeResult.success
      ? `   ${colors.bold("Unexpected: access granted")}`
      : `   ${colors.bold(`Rejected (${wrongScopeResult.status})`)} — ${wrongScopeResult.error}`,
  )

  // 6c: Expired delegation
  log(colors.dim("\n   6c. Agent with expired delegation..."))
  const expiredClaim = await signDelegationClaim(
    createDelegationClaim({
      delegatorDid: ownerDid,
      delegateDid: agentDid,
      action: "payment",
      scope: "api-access",
      expiresInSeconds: -3600, // expired 1 hour ago
    }),
    ownerPrivateKey,
  )

  const expiredResult = await callPaidApi({
    privateKey: agentPrivateKey,
    delegation: expiredClaim,
    agentId,
    serverUrl: `http://localhost:${SERVER_PORT}`,
    skipPayment: true,
  })
  log(
    expiredResult.success
      ? `   ${colors.bold("Unexpected: access granted")}`
      : `   ${colors.bold(`Rejected (${expiredResult.status})`)} — ${expiredResult.error}`,
  )

  // --- Done ---
  log(`
${colors.bold("━".repeat(50))}
${colors.bold("Demo complete.")}

  ${colors.bold("Happy path:")} Owner delegated payment/api-access → agent paid → access granted
  ${colors.bold("Wrong action:")} Rejected
  ${colors.bold("Wrong scope:")} Rejected
  ${colors.bold("Expired:")} Rejected
`)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
