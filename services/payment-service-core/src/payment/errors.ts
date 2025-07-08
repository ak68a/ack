/**
 * Base error class for payment-related errors
 */
export class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    message: string,
    public cause?: unknown
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
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // New errors
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  PAYMENT_RAIL_UNAVAILABLE = 'PAYMENT_RAIL_UNAVAILABLE',
  PAYMENT_VALIDATION_FAILED = 'PAYMENT_VALIDATION_FAILED',
  PAYMENT_EXECUTION_FAILED = 'PAYMENT_EXECUTION_FAILED',
  PAYMENT_REPOSITORY_ERROR = 'PAYMENT_REPOSITORY_ERROR'
}

/**
 * Creates a payment error with a specific code
 */
export function createPaymentError(
  code: PaymentErrorCode,
  message: string,
  cause?: unknown
): PaymentError {
  return new PaymentError(code, message, cause);
}
