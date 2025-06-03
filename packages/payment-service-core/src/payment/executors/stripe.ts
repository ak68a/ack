import { getDidResolver, verifyPaymentToken } from "agentcommercekit";
import { BasePaymentExecutor } from "./base";
import { PaymentExecutionRequest, PaymentExecutionResult } from "../types";
import { PaymentErrorCode, createPaymentError } from "../errors";
import type { ExecutorConfig } from "./types";

/**
 * A Stripe payment executor implementation.
 * Handles payment execution through the Stripe payment network.
 */
export class StripeExecutor extends BasePaymentExecutor {
  private config: ExecutorConfig;

  constructor(config: ExecutorConfig = {}) {
    super();
    this.config = config;
  }

  getPaymentMethod(): string {
    return "stripe";
  }

  canHandlePayment(network: string, currency: string): boolean {
    return network === "stripe" && currency === "USD";
  }

  async execute(request: PaymentExecutionRequest): Promise<PaymentExecutionResult> {
    // Validate the request first
    await this.validateRequest(request);

    // Verify the payment token and get the payment request
    const didResolver = getDidResolver();
    try {
      const { paymentRequest } = await verifyPaymentToken(request.paymentToken, {
        resolver: didResolver
      });

      // Find the selected payment option
      const paymentOption = paymentRequest.paymentOptions.find(
        (option) => option.id === request.paymentOptionId
      );

      if (!paymentOption) {
        throw createPaymentError(
          PaymentErrorCode.INVALID_PAYMENT_OPTION,
          "Invalid payment option"
        );
      }

      // In a real implementation, this would:
      // 1. Create a Stripe payment session
      // 2. Handle the payment flow
      // 3. Process the payment
      // For now, we'll simulate success
      return {
        success: true,
        transactionId: "stripe_" + Math.random().toString(36).substring(7),
        paymentDetails: {
          paymentRequest: paymentRequest,
          paymentOption: paymentOption
        }
      };
    } catch (err) {
      if (err instanceof Error) {
        throw createPaymentError(
          PaymentErrorCode.PAYMENT_FAILED,
          err.message,
          err
        );
      }
      throw err;
    }
  }

  /**
   * Additional validation specific to Stripe payments
   */
  protected async validateRequest(request: PaymentExecutionRequest): Promise<void> {
    // First run the base validation
    await super.validateRequest(request);

    // Then add Stripe-specific validation
    if (!this.config.apiKey) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        "Stripe API key is required"
      );
    }
  }
}
