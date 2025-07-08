import type { Payment, PaymentStatus } from "../core/types"

export interface PaymentRepository {
  savePayment(payment: Payment): Promise<void>
  getPayment(paymentId: string): Promise<Payment>
  updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void>
  findPaymentsByStatus(status: PaymentStatus): Promise<Payment[]>
  findPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]>
  findPaymentsByMethod(method: string): Promise<Payment[]>
  deletePayment(paymentId: string): Promise<void>
  getMetrics(): PaymentRepositoryMetrics
}

export interface PaymentRepositoryConfig {
  type: "memory" | "database"
  options?: Record<string, unknown>
}

export interface PaymentRepositoryMetrics {
  totalPayments: number
  paymentsByStatus: Record<PaymentStatus, number>
  paymentsByMethod: Record<string, number>
  averageQueryTime: number
  lastUpdated: Date
}
