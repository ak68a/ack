import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

// Simple logger middleware
export const logger = async (c: Context, next: Next) => {
  const start = Date.now()
  const { method, url } = c.req
  console.log(`[${method}] ${url}`)

  try {
    await next()
  } finally {
    const duration = Date.now() - start
    console.log(`[${method}] ${url} - ${duration}ms`)
  }
}

export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  console.error('Error in payment service:', err)
  return c.json({ error: err.message }, 500)
}

export const validatePaymentRequest = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json()
    if (!body.paymentOptionId || !body.paymentToken) {
      throw new HTTPException(400, { message: 'Invalid payment request' })
    }
    c.set('paymentRequest', body)
    await next()
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err
    }
    throw new HTTPException(400, { message: 'Invalid request body' })
  }
}
