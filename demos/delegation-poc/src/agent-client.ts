/**
 * Agent client that handles the MPP 402 payment flow with delegation proof.
 *
 * 1. Calls the server, gets a 402 challenge
 * 2. Parses the payment requirements
 * 3. Sends ETH payment on testnet
 * 4. Retries with payment proof + delegation claim
 */
import {
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { getChain } from "./config"
import type { DelegationClaim } from "./delegation"

type AgentClientConfig = {
  privateKey: Hex
  delegation: DelegationClaim
  agentId: number
  serverUrl: string
}

type PaymentResult = {
  success: boolean
  challengeId?: string
  txHash?: string
  response?: Record<string, unknown>
  receipt?: Record<string, unknown>
  error?: string
}

export async function callPaidApi(config: AgentClientConfig): Promise<PaymentResult> {
  const { privateKey, delegation, agentId, serverUrl } = config

  // Step 1: Call the API, expect 402
  const initialRes = await fetch(`${serverUrl}/api/data`)

  if (initialRes.status !== 402) {
    return {
      success: false,
      error: `Expected 402, got ${initialRes.status}`,
    }
  }

  // Step 2: Parse the challenge from WWW-Authenticate header
  const wwwAuth = initialRes.headers.get("WWW-Authenticate")
  if (!wwwAuth) {
    return { success: false, error: "No WWW-Authenticate header in 402 response" }
  }

  const requestMatch = wwwAuth.match(/request="([^"]+)"/)
  if (!requestMatch) {
    return { success: false, error: "No request parameter in challenge" }
  }

  const challenge = JSON.parse(atob(requestMatch[1]!))
  const challengeId = challenge.id as string
  const amount = challenge.amount as string
  const recipient = challenge.recipient as Address

  // Step 3: Send ETH payment
  const chain = getChain()
  const account = privateKeyToAccount(privateKey)

  let txHash: Hex | undefined

  if (process.env.TENDERLY_RPC_URL) {
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    })

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })

    txHash = await walletClient.sendTransaction({
      to: recipient,
      value: parseEther(amount),
    })

    await publicClient.waitForTransactionReceipt({ hash: txHash })
  }

  // Step 4: Retry with payment proof + delegation claim
  const credential = btoa(
    JSON.stringify({
      challengeId,
      txHash: txHash ?? "mock-tx-hash",
      delegation,
      agentId,
    }),
  )

  const paidRes = await fetch(`${serverUrl}/api/data`, {
    headers: {
      Authorization: `Payment ${credential}`,
    },
  })

  // Parse receipt
  const receiptHeader = paidRes.headers.get("Payment-Receipt")
  const receipt = receiptHeader ? JSON.parse(atob(receiptHeader)) : undefined

  if (paidRes.ok) {
    const data = await paidRes.json()
    return {
      success: true,
      challengeId,
      txHash,
      response: data as Record<string, unknown>,
      receipt,
    }
  }

  const error = await paidRes.json()
  return {
    success: false,
    challengeId,
    txHash,
    error: (error as Record<string, string>).error ?? `Server returned ${paidRes.status}`,
  }
}
