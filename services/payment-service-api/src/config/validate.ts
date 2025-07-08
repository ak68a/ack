import { KeypairError, validatePrivateKey } from '../utils/keypair-info'

export interface EnvConfig {
  PAYMENT_SERVICE_PRIVATE_KEY_HEX: string
  RECEIPT_SERVICE_PRIVATE_KEY_HEX: string
  SERVER_PRIVATE_KEY_HEX: string
  CLIENT_PRIVATE_KEY_HEX?: string // Optional as it's only needed for client operations
}

export class ConfigError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'ConfigError'
  }
}

/**
 * Validates that all required environment variables are present and valid.
 * In production, this should be called at startup.
 *
 * @param env - The environment variables to validate
 * @param options - Validation options
 * @returns The validated config
 * @throws {ConfigError} If any required variables are missing or invalid
 */
export async function validateConfig(
  env: Partial<EnvConfig>,
  options: {
    validateKeys?: boolean
    isProduction?: boolean
  } = {}
): Promise<EnvConfig> {
  const { validateKeys = true, isProduction = false } = options

  // Check for required keys
  const requiredKeys: (keyof EnvConfig)[] = [
    'PAYMENT_SERVICE_PRIVATE_KEY_HEX',
    'RECEIPT_SERVICE_PRIVATE_KEY_HEX',
    'SERVER_PRIVATE_KEY_HEX'
  ]

  const missingKeys = requiredKeys.filter(key => !env[key])
  if (missingKeys.length > 0) {
    throw new ConfigError(
      `Missing required environment variables: ${missingKeys.join(', ')}`
    )
  }

  // In production, ensure keys are properly formatted
  if (isProduction) {
    for (const key of requiredKeys) {
      const value = env[key]
      if (!value?.startsWith('0x') || value.length !== 66) {
        throw new ConfigError(
          `Invalid ${key} format. In production, keys must be 32-byte hex strings with 0x prefix`
        )
      }
    }
  }

  // Optionally validate that keys can be used
  if (validateKeys) {
    try {
      await Promise.all(
        requiredKeys.map(key =>
          validatePrivateKey(env[key] as string)
        )
      )
    } catch (err) {
      if (err instanceof KeypairError) {
        throw new ConfigError('Invalid private key format', err)
      }
      throw err
    }
  }

  return env as EnvConfig
}

/**
 * Gets the current environment configuration.
 * Throws if required variables are missing.
 *
 * @param options - Validation options
 * @returns The validated config
 */
export async function getConfig(options?: {
  validateKeys?: boolean
  isProduction?: boolean
}): Promise<EnvConfig> {
  return validateConfig(process.env as Partial<EnvConfig>, options)
}
