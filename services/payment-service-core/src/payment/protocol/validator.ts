import { getDidResolver, verifyPaymentToken, type JwtString } from "agentcommercekit"
import { PaymentError, PaymentErrorCode, createPaymentError } from "../errors"
import type { PaymentExecutionRequest } from "../executors/types"
import type { PaymentToken, ProtocolValidationResult } from "./types"

export class PaymentValidator {
  private didResolver = getDidResolver()

  async validate(request: PaymentExecutionRequest): Promise<void> {
    if (!request.paymentToken) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_TOKEN,
        "Payment token is required"
      )
    }

    if (!request.paymentOptionId) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_OPTION,
        "Payment option ID is required"
      )
    }

    const result = await this.verifyPaymentToken(request.paymentToken)
    if (!result.isValid) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_TOKEN,
        result.errors?.join(", ") || "Invalid payment token"
      )
    }
  }

  async verifyPaymentToken(token: string): Promise<ProtocolValidationResult> {
    try {
      const { paymentRequest } = await verifyPaymentToken(token as JwtString, {
        resolver: this.didResolver
      })

      return {
        isValid: true,
        token: {
          token: token as JwtString,
          request: paymentRequest
        }
      }
    } catch (err) {
      return {
        isValid: false,
        errors: [err instanceof Error ? err.message : "Unknown error"]
      }
    }
  }
}
