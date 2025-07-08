import type { PaymentRequest } from "../protocol/types"

/**
 * Configuration options for payment executors
 */
export interface ExecutorConfig {
  /** API key for the payment provider */
  apiKey?: string;
  /** Webhook secret for payment callbacks */
  webhookSecret?: string;
  /** Additional provider-specific configuration */
  [key: string]: unknown;
}

/**
 * Metrics for payment executors
 */
export interface ExecutorMetrics {
  /** Success rate of payments (0-1) */
  successRate: number;
  /** Average settlement time in milliseconds */
  averageSettlementTime: number;
  /** Number of successful payments */
  successfulPayments: number;
  /** Number of failed payments */
  failedPayments: number;
}

/**
 * Payment method information
 */
export interface PaymentMethodInfo {
  /** Payment method identifier */
  method: string;
  /** Supported networks */
  networks: string[];
  /** Supported currencies */
  currencies: string[];
  /** Estimated fees for the payment method */
  fees: {
    /** Fixed fee amount */
    fixed?: number;
    /** Percentage fee (0-1) */
    percentage?: number;
  };
  /** Estimated settlement time in milliseconds */
  settlementTime: number;
}

export interface PaymentExecutionRequest {
  paymentOptionId: string
  paymentToken: string
  metadata?: Record<string, unknown>
}

export interface PaymentExecutionResult {
  success: boolean
  error?: Error
  transactionId?: string
  paymentDetails?: {
    request: PaymentRequest
    option: PaymentRequest["paymentOptions"][number]
  }
  metadata?: Record<string, unknown>
}

export interface PaymentExecutorConfig {
  method: string
  networks: string[]
  currencies: string[]
  capabilities: {
    refunds: boolean
    partialRefunds: boolean
    disputes: boolean
    recurring: boolean
  }
  options?: Record<string, unknown>
}

export interface PaymentExecutorMetrics {
  totalProcessed: number
  successCount: number
  failureCount: number
  averageProcessingTime: number
  lastUpdated: Date
}
