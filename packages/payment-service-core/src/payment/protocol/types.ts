import type { JwtString } from "agentcommercekit"

export interface PaymentRequest {
  id: string
  paymentOptions: PaymentOption[]
  metadata?: Record<string, unknown>
}

export interface PaymentOption {
  id: string
  amount: number
  decimals: number
  currency: string
  recipient: string
  network?: string
  paymentService?: string
  receiptService?: string
  metadata?: Record<string, unknown>
}

export interface PaymentToken {
  token: JwtString
  request: PaymentRequest
}

export interface PaymentReceipt {
  id: string
  paymentToken: JwtString
  paymentOptionId: string
  status: "success" | "failed"
  metadata?: Record<string, unknown>
  issuedAt: Date
  expiresAt?: Date
}

export interface ProtocolValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
  token?: PaymentToken
}
