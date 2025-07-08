import { getDidResolver, verifyPaymentToken } from "agentcommercekit";
import { BasePaymentExecutor } from "./base";
import { PaymentErrorCode, createPaymentError } from "../errors";
import type { ExecutorConfig, PaymentExecutionRequest, PaymentExecutionResult, PaymentExecutorConfig } from "./types";

/**
 * A Stripe payment executor implementation.
 * Handles payment execution through the Stripe payment network.
 */
export class StripeExecutor extends BasePaymentExecutor {
  constructor(config: ExecutorConfig = {}) {
    const baseConfig: PaymentExecutorConfig = {
      method: "stripe",
      networks: ["stripe"],
      currencies: ["USD"],
      capabilities: {
        refunds: true,
        partialRefunds: true,
        disputes: true,
        recurring: true
      },
      options: config
    };
    super(baseConfig);
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
      // 1. Create a Stripe payment/checkout session (return a url)
      // 2. Handle the payment flow
      // 3. Process the payment
      // 4. Get call back url and an listen for completion event.
      // For now, we'll simulate success
      return {
        success: true,
        transactionId: "stripe_" + Math.random().toString(36).substring(7),
        paymentDetails: {
          request: paymentRequest,
          option: paymentOption
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
  async validateRequest(request: PaymentExecutionRequest): Promise<void> {
    if (!request.paymentToken) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_TOKEN,
        "Payment token is required"
      );
    }

    if (!request.paymentOptionId) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_OPTION,
        "Payment option ID is required"
      );
    }

    const options = this.config.options as ExecutorConfig;
    if (!options.apiKey) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        "Stripe API key is required"
      );
    }
  }
}
