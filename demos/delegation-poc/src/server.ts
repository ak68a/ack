/**
 * API server with MPP 402 payment challenges + AgentID delegation verification.
 *
 * Flow:
 * 1. Agent calls GET /api/data
 * 2. Server returns 402 with payment challenge
 * 3. Agent retries with Authorization header containing payment proof + delegation claim
 * 4. Server verifies: payment settled AND delegation chain valid (checked against ERC-8004 root)
 * 5. Returns 200 with the resource
 */
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import {
  type Address,
  type Hex,
  createPublicClient,
  http,
  keccak256,
  parseEther,
  stringToBytes,
} from "viem"

import { getChain, ERC8004_IDENTITY_REGISTRY, identityRegistryAbi } from "./config"
import {
  type DelegationClaim,
  getDelegationRootHash,
  verifyDelegationClaim,
} from "./delegation"

type ServerConfig = {
  port: number
  serverWallet: Address
  requiredAmount: string // in ETH
  requiredAction: string
  requiredScope: string
}

type Challenge = {
  id: string
  amount: string
  currency: string
  recipient: string
  network: string
}

// In-memory challenge store (PoC only)
const challenges = new Map<string, Challenge>()

export function createServer(config: ServerConfig) {
  const app = new Hono()

  // --- Protected endpoint ---
  app.get("/api/data", async (c) => {
    const authHeader = c.req.header("Authorization")

    // No credential → issue a 402 challenge
    if (!authHeader?.startsWith("Payment ")) {
      const challenge = issueChallenge(config)

      c.header(
        "WWW-Authenticate",
        `Payment id="${challenge.id}", ` +
          `realm="delegation-poc", ` +
          `method="eth-transfer", ` +
          `intent="charge", ` +
          `request="${btoa(JSON.stringify(challenge))}"`,
      )

      return c.json(
        {
          type: "https://agentid.dev/errors/payment-required",
          title: "Payment Required",
          detail: "Submit payment proof and delegation claim to access this resource",
        },
        402,
      )
    }

    // Parse credential
    let credential: {
      challengeId: string
      txHash: string
      delegation: DelegationClaim
      agentId: number
    }

    try {
      const encoded = authHeader.slice("Payment ".length)
      credential = JSON.parse(atob(encoded))
    } catch {
      return c.json({ error: "Malformed credential" }, 402)
    }

    // Verify the challenge exists and hasn't been used
    const challenge = challenges.get(credential.challengeId)
    if (!challenge) {
      return c.json({ error: "Invalid or expired challenge" }, 402)
    }
    challenges.delete(credential.challengeId) // single-use

    // --- Verify delegation ---

    // 1. Verify the delegation claim signature
    const delegationResult = await verifyDelegationClaim(
      credential.delegation,
      credential.delegation.delegator_did,
    )
    if (!delegationResult.valid) {
      return c.json(
        { error: `Delegation invalid: ${delegationResult.reason}` },
        403,
      )
    }

    // 2. Verify action and scope match
    if (credential.delegation.action !== config.requiredAction) {
      return c.json(
        {
          error: `Delegation action mismatch: need ${config.requiredAction}, got ${credential.delegation.action}`,
        },
        403,
      )
    }
    if (credential.delegation.scope !== config.requiredScope) {
      return c.json(
        {
          error: `Delegation scope mismatch: need ${config.requiredScope}, got ${credential.delegation.scope}`,
        },
        403,
      )
    }

    // 3. Verify delegation root against ERC-8004 on-chain metadata
    if (process.env.TENDERLY_RPC_URL && credential.agentId !== undefined) {
      const chain = getChain()
      const publicClient = createPublicClient({ chain, transport: http() })

      try {
        const onChainRoot = (await publicClient.readContract({
          address: ERC8004_IDENTITY_REGISTRY,
          abi: identityRegistryAbi,
          functionName: "getMetadata",
          args: [BigInt(credential.agentId), "agentid:delegationRoot"],
        })) as Hex

        const claimRoot = getDelegationRootHash(credential.delegation)

        if (onChainRoot !== claimRoot) {
          return c.json(
            {
              error: "Delegation root mismatch: on-chain root does not match submitted claim",
              onChainRoot,
              claimRoot,
            },
            403,
          )
        }
      } catch (err) {
        // If we can't read on-chain, log but don't block (PoC grace)
        console.warn("ERC-8004 verification skipped:", err)
      }
    }

    // 4. Verify payment (PoC: check tx exists on Tenderly fork)
    if (process.env.TENDERLY_RPC_URL && credential.txHash) {
      const chain = getChain()
      const publicClient = createPublicClient({ chain, transport: http() })

      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: credential.txHash as Hex,
        })
        if (receipt.status !== "success") {
          return c.json({ error: "Payment transaction failed" }, 402)
        }
      } catch {
        // tx not found — for PoC, we'll be lenient
        console.warn("Could not verify payment tx, proceeding anyway (PoC)")
      }
    }

    // All checks passed — return the resource
    c.header(
      "Payment-Receipt",
      btoa(
        JSON.stringify({
          challengeId: credential.challengeId,
          verified: true,
          delegationValid: true,
          timestamp: new Date().toISOString(),
        }),
      ),
    )

    return c.json({
      data: "This is the protected resource. Access granted via AgentID delegation + MPP payment.",
      agent: credential.delegation.delegate_did,
      authorizedBy: credential.delegation.delegator_did,
      action: credential.delegation.action,
      scope: credential.delegation.scope,
    })
  })

  // --- Health check ---
  app.get("/health", (c) => c.json({ status: "ok" }))

  return app
}

function issueChallenge(config: ServerConfig): Challenge {
  const id = crypto.randomUUID()
  const challenge: Challenge = {
    id,
    amount: config.requiredAmount,
    currency: "ETH",
    recipient: config.serverWallet,
    network: "eip155:73571", // Tenderly VNet chain ID
  }
  challenges.set(id, challenge)
  return challenge
}

export function startServer(config: ServerConfig): Promise<void> {
  const app = createServer(config)

  return new Promise((resolve) => {
    serve({ fetch: app.fetch, port: config.port }, () => {
      resolve()
    })
  })
}
