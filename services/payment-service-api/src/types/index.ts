import type { Env } from 'hono'

export interface PaymentServiceEnv extends Env {
  Variables: {
    PAYMENT_SERVICE_PRIVATE_KEY_HEX: string
    RECEIPT_SERVICE_PRIVATE_KEY_HEX: string
    SERVER_PRIVATE_KEY_HEX: string
  }
  Bindings: {
    PAYMENT_SERVICE_PRIVATE_KEY_HEX: string
    RECEIPT_SERVICE_PRIVATE_KEY_HEX: string
    SERVER_PRIVATE_KEY_HEX: string
  }
}

export interface PaymentRequest {
  paymentOptionId: string
  paymentToken: string
}

export interface PaymentResponse {
  paymentUrl: string
}

export interface PaymentCallbackRequest extends PaymentRequest {
  metadata: {
    eventId: string
  }
}

export interface PaymentCallbackResponse {
  receipt: string
  details: unknown
}
