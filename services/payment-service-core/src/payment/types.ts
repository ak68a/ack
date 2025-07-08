import type { PaymentRequest, PaymentOption } from "agentcommercekit";
import { PaymentError } from "./errors";

/**
 * Represents a request to execute a payment.
 * This is what our payment service receives from clients.
 */
export interface PaymentExecutionRequest {
  /**
   * The ID of the payment option to use from the PaymentRequest
   */
  paymentOptionId: string;

  /**
   * The JWT payment token from the ACK-Pay protocol
   * This token contains the PaymentRequest and is signed by the server
   */
  paymentToken: string;
}

/**
 * Represents the result of a payment execution attempt
 */
export interface PaymentExecutionResult {
  /**
   * Whether the payment was successful
   */
  success: boolean;

  /**
   * The transaction ID from the payment rail (if successful)
   * This could be a Stripe charge ID, blockchain transaction hash, etc.
   */
  transactionId?: string;

  /**
   * Any error that occurred during payment execution
   */
  error?: PaymentError;

  /**
   * The validated payment request and option
   * This is useful for receipt generation and logging
   */
  paymentDetails?: {
    paymentRequest: PaymentRequest;
    paymentOption: PaymentOption;
  };
}

/**
 * Represents the current status of a payment
 */
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}

/**
 * Represents a payment that is being tracked
 */
export interface Payment {
  /**
   * Unique identifier for this payment
   */
  id: string;

  /**
   * Current status of the payment
   */
  status: PaymentStatus;

  /**
   * The original execution request
   */
  request: PaymentExecutionRequest;

  /**
   * The execution result (if completed)
   */
  result?: PaymentExecutionResult;

  /**
   * When the payment was created
   */
  createdAt: Date;

  /**
   * When the payment was last updated
   */
  updatedAt: Date;
}
