import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger, errorHandler } from './middleware'
import paymentRoutes from './routes'
import type { PaymentServiceEnv } from './types'
import { DEFAULT_CONFIG } from './config'
import { getConfig, ConfigError } from './config/validate'

export interface CreateServerOptions {
  port?: number
  validateEnv?: boolean
  isProduction?: boolean
}

export async function createServer(options: CreateServerOptions = {}) {
  const {
    port = DEFAULT_CONFIG.port,
    validateEnv = true,
    isProduction = process.env.NODE_ENV === 'production'
  } = options

  // Validate environment variables if requested
  if (validateEnv) {
    try {
      await getConfig({
        validateKeys: true,
        isProduction
      })
    } catch (err) {
      if (err instanceof ConfigError) {
        console.error('Configuration error:', err.message)
        if (err.cause) {
          console.error('Cause:', err.cause)
        }
        process.exit(1)
      }
      throw err
    }
  }

  const app = new Hono<PaymentServiceEnv>()

  // Add middleware
  app.use(logger)
  app.onError(errorHandler)

  // Add routes
  app.route('/payment', paymentRoutes)

  // Start server
  serve({
    port,
    fetch: app.fetch
  })

  return app
}

// Export a default server instance that validates env on startup
export const server = createServer({ validateEnv: true })
