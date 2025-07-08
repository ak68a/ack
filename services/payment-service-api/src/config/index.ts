import { validateConfig } from './validate'

export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000'
export const RECEIPT_SERVICE_URL = process.env.RECEIPT_SERVICE_URL || 'http://localhost:4570'
export const DEFAULT_PORT = 4569

export const DEFAULT_CONFIG = {
  port: DEFAULT_PORT,
  paymentServiceUrl: PAYMENT_SERVICE_URL,
  receiptServiceUrl: RECEIPT_SERVICE_URL
} as const

export type PaymentServiceConfig = typeof DEFAULT_CONFIG

export interface PaymentExecutorConfig {
  apiKey: string
  webhookSecret: string
}

export function getPaymentExecutorConfig(): PaymentExecutorConfig {
  return {
    apiKey: process.env.PAYMENT_EXECUTOR_API_KEY || 'demo_api_key',
    webhookSecret: process.env.PAYMENT_EXECUTOR_WEBHOOK_SECRET || 'demo_webhook_secret'
  }
}

export { validateConfig }
export type { EnvConfig } from './validate'
