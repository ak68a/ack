import type { PaymentExecutionRequest, PaymentExecutionResult } from "../executors/types"
import type { PaymentMethod } from "./methods"

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "disputed"

export interface Payment {
  id: string
  status: PaymentStatus
  request: PaymentExecutionRequest
  result?: PaymentExecutionResult
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

export interface PaymentMethodInfo {
  method: PaymentMethod
  networks: string[]
  currencies: string[]
  fees: {
    percentage: number
    fixed: number
  }
  settlementTime: number // in milliseconds
  capabilities: {
    refunds: boolean
    partialRefunds: boolean
    disputes: boolean
    recurring: boolean
  }
}

export interface PaymentValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface PaymentMetrics {
  totalProcessed: number
  successRate: number
  averageProcessingTime: number
  errorRate: number
  lastUpdated: Date
}

// Configuration for the payment service
export interface PaymentServiceConfig {
  supportedMethods: PaymentMethod[]
  defaultCurrency: string
  maxRetries: number
  timeout: number
  enableMetrics: boolean
  enableLogging: boolean
}
