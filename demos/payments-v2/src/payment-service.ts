import { serve } from "@hono/node-server"
import { logger } from "@repo/api-utils/middleware/logger"
import { colors, errorMessage, log } from "@repo/cli-tools"
import { createJwt, getDidResolver, verifyPaymentToken } from "agentcommercekit"
import { jwtStringSchema } from "agentcommercekit/schemas/valibot"
import { Hono } from "hono"
import { env } from "hono/adapter"
import { HTTPException } from "hono/http-exception"
import * as v from "valibot"
import { PAYMENT_SERVICE_URL } from "./constants"
import { getKeypairInfo } from "./utils/keypair-info"
import { StripeExecutor } from "@repo/payment-service-core"
import type { Env, TypedResponse } from "hono"

// Keep the original payment service for reference
// import "./payment-service.original"

const app = new Hono<Env>()
app.use(logger())

const bodySchema = v.object({
  paymentOptionId: v.string(),
  paymentToken: jwtStringSchema
})

const name = colors.green(colors.bold("[Payment Service V2]"))

// Create our payment executor with demo config
const paymentExecutor = new StripeExecutor({
  // In a real implementation, these would be proper Stripe credentials
  apiKey: "demo_stripe_key",
  webhookSecret: "demo_webhook_secret"
});

/**
 * Simple endpoint which would initiate a payment flow.
 * In a real implementation, this would create a Stripe payment session.
 */
app.post("/", async (c): Promise<TypedResponse<{ paymentUrl: string }>> => {
  const { paymentOptionId, paymentToken } = v.parse(
    bodySchema,
    await c.req.json()
  );

  try {
    // Execute the payment
    const result = await paymentExecutor.execute({
      paymentOptionId,
      paymentToken
    });

    if (!result.success) {
      throw result.error;
    }

    // In a real implementation, this would be a Stripe payment URL
    const paymentUrl = `https://payments.stripe.com/payment-url/?return_to=${PAYMENT_SERVICE_URL}/stripe-callback`;

    return c.json({
      paymentUrl
    });
  } catch (err) {
    if (err instanceof Error) {
      log(errorMessage(`${name} Payment failed: ${err.message}`));
      throw new HTTPException(400, {
        message: err.message
      });
    }
    throw err;
  }
});

// Keep the callback endpoint similar to the original for compatibility
app.post(
  "/stripe-callback",
  async (c): Promise<TypedResponse<{ receipt: string }>> => {
    const serverIdentity = await getKeypairInfo(
      env(c).PAYMENT_SERVICE_PRIVATE_KEY_HEX
    );

    const { paymentOptionId, paymentToken, metadata } = v.parse(
      v.object({
        ...bodySchema.entries,
        metadata: v.object({
          eventId: v.string()
        })
      }),
      await c.req.json()
    );

    try {
      // Execute the payment
      const result = await paymentExecutor.execute({
        paymentOptionId,
        paymentToken
      });

      if (!result.success || !result.paymentDetails) {
        throw result.error;
      }

      const { paymentRequest, paymentOption } = result.paymentDetails;
      const receiptServiceUrl = paymentOption.receiptService;
      if (!receiptServiceUrl) {
        throw new Error(errorMessage("Receipt service URL is required"));
      }

      const payload = {
        paymentToken,
        paymentOptionId,
        metadata: {
          network: "stripe",
          eventId: metadata.eventId
        },
        payerDid: serverIdentity.did
      };

      const signedPayload = await createJwt(payload, {
        issuer: serverIdentity.did,
        signer: serverIdentity.jwtSigner
      });

      log(colors.dim(`${name} Getting receipt from Receipt Service...`));
      const response = await fetch(receiptServiceUrl, {
        method: "POST",
        body: JSON.stringify({
          payload: signedPayload
        })
      });

      const { receipt, details } = await response.json();

      return c.json({
        receipt,
        details
      });
    } catch (err) {
      if (err instanceof Error) {
        log(errorMessage(`${name} Payment failed: ${err.message}`));
        throw new HTTPException(400, {
          message: err.message
        });
      }
      throw err;
    }
  }
);

serve({
  port: 4569,
  fetch: app.fetch
});
