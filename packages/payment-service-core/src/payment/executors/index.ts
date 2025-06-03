import { PaymentExecutor } from './base';
import type { ExecutorConfig } from './types';
import { StripeExecutor } from './stripe';

export * from './base';
export * from './types';
export { StripeExecutor };

// Export a function to get the right executor
export function getExecutor(paymentOptionId: string, config?: ExecutorConfig): PaymentExecutor {
  // For now, we only have Stripe
  return new StripeExecutor(config);
}
