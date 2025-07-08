import type { PaymentExecutionRequest, PaymentExecutionResult, PaymentExecutorConfig } from "./types"
import { PaymentError, PaymentErrorCode, createPaymentError } from '../errors';

/**
 * Interface for payment execution strategies.
 * Different payment methods (Stripe, blockchain, etc.) will implement this interface.
 */
export interface PaymentExecutor {
  /**
   * Execute a payment using this executor's payment method
   * @param request The payment execution request
   * @returns A promise that resolves to the payment execution result
   */
  execute(request: PaymentExecutionRequest): Promise<PaymentExecutionResult>;

  /**
   * Get the payment method this executor handles
   * @returns The payment method identifier (e.g., "stripe", "ethereum", etc.)
   */
  getPaymentMethod(): string;

  /**
   * Get the networks this executor can handle
   * @returns An array of network identifiers
   */
  getNetworks(): string[];

  /**
   * Get the currencies this executor can handle
   * @returns An array of currency identifiers
   */
  getCurrencies(): string[];

  /**
   * Get the capabilities of this executor
   * @returns An object containing boolean flags for different capabilities
   */
  getCapabilities(): {
    refunds: boolean;
    partialRefunds: boolean;
    disputes: boolean;
    recurring: boolean;
  };

  /**
   * Check if this executor can handle the given payment option
   * @param network The payment network to check
   * @param currency The payment currency to check
   * @returns Whether this executor can handle the payment
   */
  canHandlePayment(network: string, currency: string): boolean;

  /**
   * Validate the payment request before execution
   * This can be overridden by specific executors for additional validation
   */
  validateRequest(request: PaymentExecutionRequest): Promise<void>;

  /**
   * Get the configuration of this executor
   * @returns The executor configuration
   */
  getConfig(): PaymentExecutorConfig;
}

/**
 * Abstract base class for payment executors.
 * Provides common functionality that all executors will need.
 */
export abstract class BasePaymentExecutor implements PaymentExecutor {
  protected config: PaymentExecutorConfig;

  constructor(config: PaymentExecutorConfig) {
    this.config = config;
  }

  abstract execute(request: PaymentExecutionRequest): Promise<PaymentExecutionResult>;
  abstract getPaymentMethod(): string;

  getNetworks(): string[] {
    return this.config.networks;
  }

  getCurrencies(): string[] {
    return this.config.currencies;
  }

  getCapabilities() {
    return this.config.capabilities;
  }

  canHandlePayment(network: string, currency: string): boolean {
    return (
      this.config.networks.includes(network) &&
      this.config.currencies.includes(currency)
    );
  }

  abstract validateRequest(request: PaymentExecutionRequest): Promise<void>;

  getConfig(): PaymentExecutorConfig {
    return this.config;
  }
}
