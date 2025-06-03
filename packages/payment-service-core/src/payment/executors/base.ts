import { PaymentExecutionRequest, PaymentExecutionResult } from '../types';
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
   * Check if this executor can handle the given payment option
   * @param network The payment network to check
   * @param currency The payment currency to check
   * @returns Whether this executor can handle the payment
   */
  canHandlePayment(network: string, currency: string): boolean;
}

/**
 * Abstract base class for payment executors.
 * Provides common functionality that all executors will need.
 */
export abstract class BasePaymentExecutor implements PaymentExecutor {
  abstract execute(request: PaymentExecutionRequest): Promise<PaymentExecutionResult>;
  abstract getPaymentMethod(): string;
  abstract canHandlePayment(network: string, currency: string): boolean;

  /**
   * Validate the payment request before execution
   * This can be overridden by specific executors for additional validation
   */
  protected async validateRequest(request: PaymentExecutionRequest): Promise<void> {
    if (!request.paymentToken) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_TOKEN,
        'Payment token is required'
      );
    }

    if (!request.paymentOptionId) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_OPTION,
        'Payment option ID is required'
      );
    }
  }
}
