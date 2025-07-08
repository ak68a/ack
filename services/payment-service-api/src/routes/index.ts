import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createJwt } from 'agentcommercekit'
import { StripeExecutor } from '@repo/payment-service-core'
import { logger, errorHandler, validatePaymentRequest } from '../middleware'
import type { PaymentServiceEnv, PaymentRequest, PaymentResponse, PaymentCallbackRequest, PaymentCallbackResponse } from '../types'
import { PAYMENT_SERVICE_URL } from '../config'
import { getKeypairInfo } from '../utils/keypair-info'
import { signJwt } from '../utils/jwt'
import { getPaymentExecutorConfig } from '../config'

// Extend the context type to include our custom variables
declare module 'hono' {
  interface ContextVariableMap {
    paymentRequest: PaymentRequest
  }
}

const app = new Hono<PaymentServiceEnv>()

// Middleware
app.use('*', logger)
app.onError(errorHandler)

// Routes
app.post('/payment', validatePaymentRequest, async (c) => {
  const { paymentOptionId, paymentToken } = c.get('paymentRequest') as PaymentRequest
  const { apiKey, webhookSecret } = getPaymentExecutorConfig()

  // Sign the payment token with our private key
  const signedToken = await signJwt(
    { paymentToken, paymentOptionId },
    c.env.PAYMENT_SERVICE_PRIVATE_KEY_HEX,
    { expiresIn: '5m' }
  )

  // In a real implementation, we would:
  // 1. Validate the payment token
  // 2. Check if the payment option is valid
  // 3. Create a payment session
  // 4. Return a payment URL

  const response: PaymentResponse = {
    paymentUrl: `https://payment-executor.example.com/pay?token=${signedToken}`,
  }

  return c.json(response)
})

app.post('/payment/callback', async (c) => {
  const body = await c.req.json<PaymentCallbackRequest>()
  const { paymentOptionId, paymentToken, metadata } = body

  // In a real implementation, we would:
  // 1. Validate the callback signature
  // 2. Verify the payment was successful
  // 3. Generate a receipt
  // 4. Store the payment details

  const receipt = await signJwt(
    { paymentToken, paymentOptionId, metadata },
    c.env.RECEIPT_SERVICE_PRIVATE_KEY_HEX,
    { expiresIn: '1h' }
  )

  const response: PaymentCallbackResponse = {
    receipt,
    details: {
      status: 'success',
      timestamp: new Date().toISOString(),
    },
  }

  return c.json(response)
})

export default app
