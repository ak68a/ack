export type PaymentMethod =
  | "stripe"    // Credit card payments via Stripe
  | "usdc"      // USDC on-chain payments
  | "bank"      // Bank transfers
  | "crypto"    // Other cryptocurrency payments
  | "custom"    // Custom payment methods
