# Payment Service API

A production-ready payment service API that handles payment processing, JWT signing, and receipt generation. Built with Hono and TypeScript.

## Features

- 🔐 Secure JWT signing with EdDSA
- 🔑 Environment validation for private keys
- 📝 Request logging and error handling
- 🎯 Type-safe API endpoints
- 🏗️ Production-ready configuration

## Quick Start

1. Install dependencies:
```bash
npm install @repo/payment-service-api
```

2. Set up environment variables (see `.env.example`):
```env
# Required private keys (hex format)
CLIENT_PRIVATE_KEY_HEX=your_client_private_key_here
SERVER_PRIVATE_KEY_HEX=your_server_private_key_here
RECEIPT_SERVICE_PRIVATE_KEY_HEX=your_receipt_service_private_key_here
PAYMENT_SERVICE_PRIVATE_KEY_HEX=your_payment_service_private_key_here

# Optional service URLs
PAYMENT_SERVICE_URL=http://localhost:3000
RECEIPT_SERVICE_URL=http://localhost:4570
```

3. Start the server:
```typescript
import { createServer } from '@repo/payment-service-api'

const server = await createServer({
  port: 3000,
  validateEnv: true,
  isProduction: process.env.NODE_ENV === 'production'
})
```

## API Endpoints

### Initiate Payment
```http
POST /payment
Content-Type: application/json

{
  "paymentOptionId": "option_123",
  "paymentToken": "token_456"
}
```

Response:
```json
{
  "paymentUrl": "https://payment-executor.example.com/pay?token=<signed_token>"
}
```

### Payment Callback
```http
POST /payment/callback
Content-Type: application/json

{
  "paymentOptionId": "option_123",
  "paymentToken": "token_456",
  "metadata": {
    "eventId": "event_789"
  }
}
```

Response:
```json
{
  "receipt": "<signed_receipt>",
  "details": {
    "status": "success",
    "timestamp": "2024-03-14T12:00:00Z"
  }
}
```

## Testing with Postman

You can test the API using Postman or any HTTP client:

1. Start the server (default port: 3000)
2. Create a new request in Postman:
   - Method: POST
   - URL: http://localhost:3000/payment
   - Headers: Content-Type: application/json
   - Body (raw JSON):
   ```json
   {
     "paymentOptionId": "option_123",
     "paymentToken": "token_456"
   }
   ```

3. Send the request and you should receive a payment URL with a signed token

## Integration Testing

You can also test the API programmatically:

```typescript
// Making requests
const response = await fetch('http://localhost:3000/payment', {
  method: 'POST',
  body: JSON.stringify({
    paymentOptionId: 'option_123',
    paymentToken: 'token_456'
  })
})

const data = await response.json()
console.log('Payment URL:', data.paymentUrl)
```

## Development

- `npm run build` - Build the package
- `npm run dev` - Watch mode for development
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Production Considerations

- Always set `isProduction: true` in production
- Ensure all private keys are properly set
- Monitor logs for errors
- Use proper error handling in your client code
- Consider rate limiting for production use
