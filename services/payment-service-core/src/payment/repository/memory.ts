import { PaymentError, PaymentErrorCode, createPaymentError } from "../errors"
import type { Payment, PaymentStatus } from "../core/types"
import type { PaymentRepository, PaymentRepositoryMetrics } from "./interface"

export class InMemoryPaymentRepository implements PaymentRepository {
  private payments: Map<string, Payment>
  private metrics: PaymentRepositoryMetrics

  constructor() {
    this.payments = new Map()
    this.metrics = {
      totalPayments: 0,
      paymentsByStatus: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        refunded: 0,
        disputed: 0
      } as Record<PaymentStatus, number>,
      paymentsByMethod: {} as Record<string, number>,
      averageQueryTime: 0,
      lastUpdated: new Date()
    }
  }

  async savePayment(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment)
    this.updateMetrics(payment)
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const payment = this.payments.get(paymentId)
    if (!payment) {
      throw createPaymentError(
        PaymentErrorCode.PAYMENT_NOT_FOUND,
        `Payment ${paymentId} not found`
      )
    }
    return payment
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    const payment = await this.getPayment(paymentId)
    const oldStatus = payment.status
    payment.status = status
    payment.updatedAt = new Date()
    await this.savePayment(payment)

    // Update metrics
    this.metrics.paymentsByStatus[oldStatus]--
    this.metrics.paymentsByStatus[status]++
    this.metrics.lastUpdated = new Date()
  }

  async findPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.status === status)
  }

  async findPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment =>
        payment.createdAt >= startDate &&
        payment.createdAt <= endDate
      )
  }

  async findPaymentsByMethod(method: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment =>
        payment.request.paymentOptionId.startsWith(method)
      )
  }

  async deletePayment(paymentId: string): Promise<void> {
    const payment = await this.getPayment(paymentId)
    this.payments.delete(paymentId)

    // Update metrics
    this.metrics.totalPayments--
    this.metrics.paymentsByStatus[payment.status]--
    const method = payment.request.paymentOptionId.split("-")[0] || "unknown"
    const currentCount = this.metrics.paymentsByMethod[method] || 0
    this.metrics.paymentsByMethod[method] = Math.max(0, currentCount - 1)
    this.metrics.lastUpdated = new Date()
  }

  private updateMetrics(payment: Payment): void {
    this.metrics.totalPayments = this.payments.size
    this.metrics.paymentsByStatus[payment.status]++
    const method = payment.request.paymentOptionId.split("-")[0] || "unknown"
    const currentCount = this.metrics.paymentsByMethod[method] || 0
    this.metrics.paymentsByMethod[method] = currentCount + 1
    this.metrics.lastUpdated = new Date()
  }

  getMetrics(): PaymentRepositoryMetrics {
    return { ...this.metrics }
  }
}
