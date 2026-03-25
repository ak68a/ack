/**
 * ERC-8004 IdentityRegistry helpers.
 *
 * Register agents, store delegation roots, and read metadata
 * from the on-chain registry.
 */
import {
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  http,
  toHex,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import {
  ERC8004_IDENTITY_REGISTRY,
  getChain,
  identityRegistryAbi,
} from "./config"

function getClients(privateKey: Hex) {
  const chain = getChain()
  const account = privateKeyToAccount(privateKey)

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  })

  return { publicClient, walletClient, account }
}

/** Register an agent on ERC-8004 with an optional delegation root in metadata. */
export async function registerAgent(params: {
  ownerPrivateKey: Hex
  agentURI: string
  delegationRootHash?: Hex
}): Promise<{ agentId: bigint; txHash: Hex }> {
  const { publicClient, walletClient } = getClients(params.ownerPrivateKey)

  const metadata: { metadataKey: string; metadataValue: Hex }[] = []

  if (params.delegationRootHash) {
    metadata.push({
      metadataKey: "agentid:delegationRoot",
      metadataValue: params.delegationRootHash,
    })
  }

  const txHash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: "register",
    args: [params.agentURI, metadata],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  // Parse the ERC-721 Transfer event to get the agentId (tokenId).
  // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
  // On mint, `from` is the zero address.
  const transferEventSig =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

  const mintLog = receipt.logs.find(
    (log) =>
      log.address.toLowerCase() === ERC8004_IDENTITY_REGISTRY.toLowerCase() &&
      log.topics[0] === transferEventSig,
  )

  // tokenId (agentId) is the third indexed topic
  const agentId = mintLog?.topics[3] ? BigInt(mintLog.topics[3]) : 0n

  return { agentId, txHash }
}

/** Store or update the delegation root hash in ERC-8004 metadata. */
export async function setDelegationRoot(params: {
  ownerPrivateKey: Hex
  agentId: bigint
  delegationRootHash: Hex
}): Promise<Hex> {
  const { publicClient, walletClient } = getClients(params.ownerPrivateKey)

  const txHash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: "setMetadata",
    args: [params.agentId, "agentid:delegationRoot", params.delegationRootHash],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

/** Read the delegation root hash from ERC-8004 metadata. */
export async function getDelegationRoot(agentId: bigint): Promise<Hex | null> {
  const chain = getChain()
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  const result = await publicClient.readContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: "getMetadata",
    args: [agentId, "agentid:delegationRoot"],
  })

  if (!result || result === "0x") return null
  return result as Hex
}

/** Read the agent's wallet address from ERC-8004. */
export async function getAgentWallet(agentId: bigint): Promise<Address> {
  const chain = getChain()
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  return publicClient.readContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: "getAgentWallet",
    args: [agentId],
  }) as Promise<Address>
}
