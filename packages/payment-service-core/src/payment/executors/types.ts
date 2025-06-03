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
