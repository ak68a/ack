/**
 * Base error class for payment-related errors
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Error codes for different payment error scenarios
 */
export enum PaymentErrorCode {
  // Validation errors
  INVALID_PAYMENT_TOKEN = 'INVALID_PAYMENT_TOKEN',
  INVALID_PAYMENT_OPTION = 'INVALID_PAYMENT_OPTION',
  EXPIRED_PAYMENT_REQUEST = 'EXPIRED_PAYMENT_REQUEST',

  // Execution errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

/**
 * Creates a payment error with a specific code
 */
export function createPaymentError(
  code: PaymentErrorCode,
  message: string,
  details?: unknown
): PaymentError {
  return new PaymentError(message, code, details);
}
