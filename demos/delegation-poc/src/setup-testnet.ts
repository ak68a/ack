/**
 * Creates a Tenderly Virtual TestNet forked from Sepolia
 * and funds the owner + agent wallets with test ETH.
 *
 * Run once before the demo:
 *   TENDERLY_ACCESS_KEY=xxx npx tsx src/setup-testnet.ts
 *
 * Outputs the env vars to paste into .env
 */
import { colors, log } from "@repo/cli-tools"

const TENDERLY_ACCOUNT = "ak68a"
const TENDERLY_PROJECT = "agentid"
const TENDERLY_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}`

const accessKey = process.env.TENDERLY_ACCESS_KEY
if (!accessKey) {
  console.error("Set TENDERLY_ACCESS_KEY env var first")
  process.exit(1)
}

async function main() {
  log(colors.bold("Creating Tenderly Virtual TestNet (Sepolia fork)...\n"))

  // 1. Create the Virtual TestNet
  const createRes = await fetch(`${TENDERLY_API}/vnets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Access-Key": accessKey!,
    },
    body: JSON.stringify({
      slug: "agentid-poc",
      display_name: "AgentID PoC (Sepolia Fork)",
      fork_config: {
        network_id: 11155111,
        block_number: "latest",
      },
      virtual_network_config: {
        chain_config: {
          chain_id: 73571,
        },
      },
      sync_state_config: {
        enabled: false,
      },
      explorer_page_config: {
        enabled: true,
        verification_visibility: "bytecode",
      },
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error(`Failed to create VNet: ${createRes.status} ${err}`)
    process.exit(1)
  }

  const vnet = await createRes.json()

  // Extract RPC URLs
  const adminRpc = vnet.rpcs?.find((r: { name: string }) => r.name === "Admin RPC")?.url
  const publicRpc = vnet.rpcs?.find((r: { name: string }) => r.name !== "Admin RPC")?.url

  if (!adminRpc || !publicRpc) {
    console.error("Could not find RPC URLs in response")
    console.error(JSON.stringify(vnet, null, 2))
    process.exit(1)
  }

  log(`  Admin RPC: ${adminRpc}`)
  log(`  Public RPC: ${publicRpc}`)

  // 2. Generate wallets
  const ownerKey = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`
  const agentKey = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`

  // Derive addresses using viem
  const { privateKeyToAccount } = await import("viem/accounts")
  const ownerAddress = privateKeyToAccount(ownerKey as `0x${string}`).address
  const agentAddress = privateKeyToAccount(agentKey as `0x${string}`).address

  log(`\n  Owner: ${ownerAddress}`)
  log(`  Agent: ${agentAddress}`)

  // 3. Fund both wallets with 100 ETH each
  log(colors.bold("\nFunding wallets with 100 ETH each..."))

  const fundRes = await fetch(adminRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tenderly_setBalance",
      params: [
        [ownerAddress, agentAddress],
        "0x56BC75E2D63100000", // 100 ETH
      ],
      id: "1",
    }),
  })

  const fundResult = await fundRes.json()
  if (fundResult.error) {
    console.error("Funding failed:", fundResult.error)
    process.exit(1)
  }

  log("  Done")

  // 4. Output env vars
  log(colors.bold("\n━━━ Add these to .env ━━━\n"))
  log(`TENDERLY_RPC_URL=${publicRpc}`)
  log(`TENDERLY_ADMIN_RPC_URL=${adminRpc}`)
  log(`OWNER_PRIVATE_KEY=${ownerKey}`)
  log(`AGENT_PRIVATE_KEY=${agentKey}`)
  log("")
  log(colors.dim(`Owner address: ${ownerAddress}`))
  log(colors.dim(`Agent address: ${agentAddress}`))
  log(colors.dim(`VNet chain ID: 73571`))
  log(colors.dim(`\nRun the demo: pnpm demo`))
}

main().catch(console.error)
