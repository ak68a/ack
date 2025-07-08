import {
  bytesToHexString,
  createDidPkhUri,
  createJwtSigner,
  generateKeypair,
  hexStringToBytes,
  type DidUri,
  type JwtSigner,
  type Keypair,
  type KeypairAlgorithm
} from 'agentcommercekit'
import { privateKeyToAccount, type Account } from 'viem/accounts'
import { publicKeyToAddress } from 'viem/utils'
import { HTTPException } from 'hono/http-exception'

export interface KeypairInfo {
  publicKeyHex: `0x${string}`
  did: DidUri
  keypair: Keypair
  jwtSigner: JwtSigner
  crypto: {
    address: `0x${string}`
    account: Account
  }
}

export class KeypairError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'KeypairError'
  }
}

/**
 * Generates a KeypairInfo object from a private key.
 *
 * @param privateKeyHex - The private key in hex string format
 * @param alg - The algorithm for the Keypair (defaults to secp256k1)
 * @returns A KeypairInfo object
 * @throws {KeypairError} If the private key is invalid or keypair generation fails
 */
export async function getKeypairInfo(
  privateKeyHex: string,
  alg: KeypairAlgorithm = 'secp256k1'
): Promise<KeypairInfo> {
  try {
    if (!privateKeyHex) {
      throw new KeypairError('Private key is required')
    }

    // Remove 0x prefix if present
    const cleanKey = privateKeyHex.startsWith('0x')
      ? privateKeyHex.slice(2)
      : privateKeyHex

    // Convert hex to bytes and generate keypair
    const keypair = await generateKeypair(alg, hexStringToBytes(cleanKey))

    // Generate Ethereum address from public key
    const address = publicKeyToAddress(`0x${bytesToHexString(keypair.publicKey)}`)

    // Create Ethereum account from private key
    const account = privateKeyToAccount(`0x${bytesToHexString(keypair.privateKey)}`)

    // Create DID from address (using Base Sepolia chain ID)
    const did = createDidPkhUri(address, 'eip155:84532')

    // Create JWT signer
    const jwtSigner = createJwtSigner(keypair)

    return {
      publicKeyHex: `0x${bytesToHexString(keypair.publicKey)}`,
      keypair,
      did,
      jwtSigner,
      crypto: {
        address,
        account
      }
    }
  } catch (err) {
    if (err instanceof KeypairError) {
      throw err
    }
    throw new KeypairError(
      'Failed to generate keypair info',
      err
    )
  }
}

/**
 * Validates that a private key is properly formatted and can be used.
 *
 * @param privateKeyHex - The private key to validate
 * @returns true if the key is valid
 * @throws {KeypairError} If the key is invalid
 */
export async function validatePrivateKey(privateKeyHex: string): Promise<boolean> {
  try {
    await getKeypairInfo(privateKeyHex)
    return true
  } catch (err) {
    if (err instanceof KeypairError) {
      throw err
    }
    throw new KeypairError('Invalid private key format')
  }
}

/**
 * Generates a new private key.
 * Note: This should only be used in development/testing environments.
 * In production, keys should be provisioned securely.
 *
 * @returns A new private key in hex format
 */
export async function generatePrivateKeyHex(): Promise<`0x${string}`> {
  try {
    const { privateKey } = await generateKeypair('secp256k1')
    return `0x${bytesToHexString(privateKey)}`
  } catch (err) {
    throw new KeypairError('Failed to generate private key', err)
  }
}
