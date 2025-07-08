import { SignJWT } from 'jose'

interface JwtOptions {
  expiresIn?: string
  issuer?: string
}

export async function signJwt(
  payload: unknown,
  privateKeyHex: string,
  options: JwtOptions = {}
): Promise<string> {
  const { expiresIn = '1h', issuer } = options

  // Convert hex private key to Uint8Array
  const privateKeyBytes = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  )

  const jwt = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)

  if (issuer) {
    jwt.setIssuer(issuer)
  }

  return jwt.sign(privateKeyBytes)
}
