/**
 * AgentID delegation model — TypeScript port of the Go implementation.
 *
 * Provides delegation claim creation, signing, verification, and chain
 * validation using secp256k1 signatures and keccak256 hashing, compatible
 * with the Go AgentID signer.
 */
import {
  type Address,
  type Hex,
  encodePacked,
  hashMessage,
  keccak256,
  recoverAddress,
  stringToBytes,
  toHex,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

// --- Types ---

export type CredentialProof = {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  proofValue: string
  domain: {
    name: string
    version: string
    chainId: number
  }
}

export type DelegationClaim = {
  delegator_did: string
  delegate_did: string
  action: string
  scope: string
  constraints: Record<string, unknown>
  issued_at: number
  expires_at: number
  nonce: string
  parent_delegation?: string
  max_depth: number
  current_depth: number
  type?: string[]
  "@context"?: string[]
  issuer?: string
  subject?: string
  proof?: CredentialProof
}

export type DelegationChain = {
  delegations: DelegationClaim[]
  valid: boolean
  reason?: string
}

// --- Helpers ---

const DID_PREFIX = "did:pkh:eip155:11155111:"

export function addressToDid(address: Address): string {
  return `${DID_PREFIX}${address.toLowerCase()}`
}

export function didToAddress(did: string): Address {
  const parts = did.split(":")
  const address = parts[parts.length - 1]
  if (!address) throw new Error(`Invalid DID: ${did}`)
  return address as Address
}

/** Hash a delegation claim (without proof) using keccak256 of its canonical JSON. */
function hashClaim(claim: DelegationClaim): Hex {
  const { proof: _, ...claimWithoutProof } = claim
  const json = JSON.stringify(claimWithoutProof)
  return keccak256(stringToBytes(json))
}

// --- Creation ---

export function createDelegationClaim(params: {
  delegatorDid: string
  delegateDid: string
  action: string
  scope: string
  maxDepth?: number
  expiresInSeconds?: number
  constraints?: Record<string, unknown>
}): DelegationClaim {
  const now = Math.floor(Date.now() / 1000)

  return {
    delegator_did: params.delegatorDid,
    delegate_did: params.delegateDid,
    action: params.action,
    scope: params.scope,
    constraints: params.constraints ?? {},
    issued_at: now,
    expires_at: now + (params.expiresInSeconds ?? 3600),
    nonce: crypto.randomUUID(),
    max_depth: params.maxDepth ?? 1,
    current_depth: 0,
    type: ["VerifiableCredential", "DelegationCredential"],
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://agentcommercekit.com/contexts/ack-id/v1",
    ],
    issuer: params.delegatorDid,
    subject: params.delegateDid,
  }
}

// --- Signing ---

export async function signDelegationClaim(
  claim: DelegationClaim,
  privateKey: Hex,
): Promise<DelegationClaim> {
  const account = privateKeyToAccount(privateKey)
  const hash = hashClaim(claim)

  // Sign the raw hash (not EIP-191 prefixed) to match Go's crypto.Sign behavior
  const signature = await account.signMessage({ message: { raw: hash } })

  return {
    ...claim,
    proof: {
      type: "EcdsaSecp256k1Signature2019",
      created: new Date().toISOString(),
      verificationMethod: `${claim.delegator_did}#key-1`,
      proofPurpose: "assertionMethod",
      proofValue: signature,
      domain: {
        name: "AgentID",
        version: "1",
        chainId: 11155111, // Sepolia
      },
    },
  }
}

// --- Verification ---

export async function verifyDelegationClaim(
  claim: DelegationClaim,
  expectedDelegatorDid: string,
): Promise<{ valid: boolean; reason?: string }> {
  if (!claim.proof) {
    return { valid: false, reason: "Delegation claim has no proof" }
  }

  if (claim.delegator_did !== expectedDelegatorDid) {
    return {
      valid: false,
      reason: `Delegator DID mismatch: expected ${expectedDelegatorDid}, got ${claim.delegator_did}`,
    }
  }

  if (claim.expires_at !== 0 && Math.floor(Date.now() / 1000) > claim.expires_at) {
    return { valid: false, reason: "Delegation claim has expired" }
  }

  const expectedAddress = didToAddress(claim.delegator_did)
  const hash = hashClaim(claim)

  try {
    const recoveredAddress = await recoverAddress({
      hash: hashMessage({ raw: hash }),
      signature: claim.proof.proofValue as Hex,
    })

    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      return {
        valid: false,
        reason: `Signature does not match delegator address: recovered ${recoveredAddress}, expected ${expectedAddress}`,
      }
    }

    return { valid: true }
  } catch (err) {
    return {
      valid: false,
      reason: `Signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export async function verifyDelegationChain(
  chain: DelegationChain,
): Promise<{ valid: boolean; reason?: string }> {
  if (chain.delegations.length === 0) {
    return { valid: false, reason: "Empty delegation chain" }
  }

  for (let i = 0; i < chain.delegations.length; i++) {
    const delegation = chain.delegations[i]!

    // Check expiration
    if (delegation.expires_at !== 0 && Math.floor(Date.now() / 1000) > delegation.expires_at) {
      return { valid: false, reason: `Delegation ${i} has expired` }
    }

    // Check depth
    if (delegation.current_depth > delegation.max_depth) {
      return { valid: false, reason: `Delegation ${i} exceeds max depth` }
    }

    // Verify signature
    const expectedDelegator =
      i === 0
        ? delegation.delegator_did
        : chain.delegations[i - 1]!.delegate_did

    // Chain continuity check
    if (i > 0 && delegation.delegator_did !== chain.delegations[i - 1]!.delegate_did) {
      return { valid: false, reason: `Broken chain at delegation ${i}` }
    }

    const result = await verifyDelegationClaim(delegation, expectedDelegator)
    if (!result.valid) {
      return { valid: false, reason: `Delegation ${i}: ${result.reason}` }
    }
  }

  return { valid: true }
}

// --- Root hash (for on-chain anchoring) ---

/** Returns the keccak256 hash of a signed delegation claim, used as the on-chain anchor in ERC-8004 metadata. */
export function getDelegationRootHash(claim: DelegationClaim): Hex {
  const json = JSON.stringify(claim)
  return keccak256(stringToBytes(json))
}
