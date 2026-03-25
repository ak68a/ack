/**
 * Shared configuration for the delegation PoC.
 *
 * Uses Tenderly Virtual TestNet (forked from Sepolia) for development,
 * or real Sepolia for public demos.
 */
import { type Chain, sepolia } from "viem/chains"

// ERC-8004 IdentityRegistry — deterministic addresses per network type
const ERC8004_TESTNET_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const
const ERC8004_MAINNET_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const

// We fork Sepolia (testnet), so use the testnet address
export const ERC8004_IDENTITY_REGISTRY = ERC8004_TESTNET_REGISTRY

// Minimal ABI — only the functions we use
export const identityRegistryAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentURI", type: "string" },
      {
        name: "metadata",
        type: "tuple[]",
        components: [
          { name: "metadataKey", type: "string" },
          { name: "metadataValue", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "setMetadata",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataKey", type: "string" },
      { name: "metadataValue", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "getMetadata",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataKey", type: "string" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    name: "getAgentWallet",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const

// Tenderly Virtual TestNet chain ID (set when creating the VNet)
const TENDERLY_CHAIN_ID = 73571

// Chain configuration
export function getChain(): Chain {
  const rpcUrl = process.env.TENDERLY_RPC_URL
  if (rpcUrl) {
    return {
      ...sepolia,
      id: TENDERLY_CHAIN_ID,
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    } as Chain
  }
  return sepolia
}
