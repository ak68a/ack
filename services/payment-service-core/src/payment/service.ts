import { randomUUID } from "node:crypto"
import { PaymentError, PaymentErrorCode, createPaymentError } from "./errors"
import { PaymentRailManager } from "./rail/manager"
import { PaymentValidator } from "./protocol/validator"
import type { PaymentRepository } from "./repository/interface"
import type { Payment, PaymentStatus } from "./core/types"
import type { PaymentServiceConfig } from "./core/types"
import type { PaymentExecutionRequest } from "./executors/types"
import type { PaymentOption } from "./protocol/types"

export class PaymentService {
  constructor(
    private railManager: PaymentRailManager,
    private validator: PaymentValidator,
    private repository: PaymentRepository,
    private config: PaymentServiceConfig
  ) {}

  async processPayment(request: PaymentExecutionRequest): Promise<Payment> {
    // 1. Validate request
    await this.validator.validate(request)

    // 2. Get payment rail
    const result = await this.validator.verifyPaymentToken(request.paymentToken)
    if (!result.isValid || !result.token) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_TOKEN,
        result.errors?.join(", ") || "Invalid payment token"
      )
    }
    const { request: paymentRequest } = result.token

    const paymentOption = paymentRequest.paymentOptions.find(
      (option: PaymentOption) => option.id === request.paymentOptionId
    )

    if (!paymentOption) {
      throw createPaymentError(
        PaymentErrorCode.INVALID_PAYMENT_OPTION,
        "Invalid payment option"
      )
    }


    // TODO: In a kafka way of doing this, we will get the "topic/box/queue" or topics or let the orchestration handle it
    // May need different topics for different payment methods."
    const rail = this.railManager.getRail(
      paymentOption.network || "unknown",
      paymentOption.currency
    )

    if (!rail) {
      throw createPaymentError(
        PaymentErrorCode.PAYMENT_RAIL_UNAVAILABLE,
        `No payment rail available for ${paymentOption.network || "unknown"}/${paymentOption.currency}`
      )
    }

    // 3. Create payment record
    const payment: Payment = {
      id: randomUUID(),
      status: "processing",
      request,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await this.repository.savePayment(payment)

    try {
      // 4. Execute payment
      // TODO: Turn into message dispatch to Kafka.
      // Code that is doing the execution will be the message listner and dispatch the "execute_transaction" message.
      // You can either send the payment request to a generic queue where the orchestration will handle it or you can send it to a specific queue for the payment method. Or send it to a specific queue for the payment method and a payment processor will handle it (executor / integration).
      // Tricky part is the return stuff in an async model. You have to listen to responses from kafka and update the payment record.
      const result = await rail.execute(request)

      // 5. Update payment record
      payment.status = result.success ? "completed" : "failed"
      payment.result = result
      payment.updatedAt = new Date()
      await this.repository.savePayment(payment)

      return payment
    } catch (err) {
      // 6. Handle failure
      payment.status = "failed"
      payment.result = {
        success: false,
        error: err instanceof PaymentError ? err : createPaymentError(
          PaymentErrorCode.PAYMENT_EXECUTION_FAILED,
          err instanceof Error ? err.message : "Unknown error",
          err
        )
      }
      payment.updatedAt = new Date()
      await this.repository.savePayment(payment)

      throw payment.result.error
    }
  }

  async getPayment(paymentId: string): Promise<Payment> {
    return this.repository.getPayment(paymentId)
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<void> {
    await this.repository.updatePaymentStatus(paymentId, status)
  }

  getAvailablePaymentMethods() {
    return this.railManager.getAvailableRails()
  }

  getPaymentMetrics() {
    const metrics = (this.repository as any).getMetrics?.()
    if (!metrics) {
      return {
        totalProcessed: 0,
        byStatus: {},
        byMethod: {},
        lastUpdated: new Date()
      }
    }

    return {
      totalProcessed: metrics.totalPayments,
      byStatus: metrics.paymentsByStatus,
      byMethod: metrics.paymentsByMethod,
      lastUpdated: metrics.lastUpdated
    }
  }
}
