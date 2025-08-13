# @agentcommercekit/keys

## 0.9.0

### Patch Changes

- [#29](https://github.com/agentcommercekit/ack/pull/29) [`05d7c03`](https://github.com/agentcommercekit/ack/commit/05d7c033ea150b840429c112f9c41e2c0c89ac78) Thanks [@venables](https://github.com/venables)! - Improve JWK methods, add did:jwks support

## 0.8.1

### Patch Changes

- [#27](https://github.com/agentcommercekit/ack/pull/27) [`8ea5846`](https://github.com/agentcommercekit/ack/commit/8ea5846b931bad5cd94ad1302ddf00ed51c285c9) Thanks [@venables](https://github.com/venables)! - Add did:pkh support for more chains, including solana

- [#27](https://github.com/agentcommercekit/ack/pull/27) [`8ea5846`](https://github.com/agentcommercekit/ack/commit/8ea5846b931bad5cd94ad1302ddf00ed51c285c9) Thanks [@venables](https://github.com/venables)! - Add schemas for CAIP-2, CAIP-10, CAIP-19 which are used by did:pkh

## 0.7.1

### Patch Changes

- [#23](https://github.com/agentcommercekit/ack/pull/23) [`fceb090`](https://github.com/agentcommercekit/ack/commit/fceb09050306374157b739f50f098a07b4cefaad) Thanks [@venables](https://github.com/venables)! - Add isValidPublicKey for each of the supported curves

## 0.6.1

### Patch Changes

- [#21](https://github.com/agentcommercekit/ack/pull/21) [`36da071`](https://github.com/agentcommercekit/ack/commit/36da0717b65d7f882c7a16cd4e6a1667d8dfccb6) Thanks [@venables](https://github.com/venables)! - Update private key generation to by sync

## 0.6.0

### Minor Changes

- [#19](https://github.com/agentcommercekit/ack/pull/19) [`ad7b0a0`](https://github.com/agentcommercekit/ack/commit/ad7b0a0327c2cd0366a37f7ab96a53a456934fc3) Thanks [@venables](https://github.com/venables)! - Update interfaces to separate key curves from jwt signing algorithms

- [#20](https://github.com/agentcommercekit/ack/pull/20) [`829f5e7`](https://github.com/agentcommercekit/ack/commit/829f5e7c4a546f9ec0cf61d0cd19c99d62fd4eb9) Thanks [@venables](https://github.com/venables)! - Improve JWK encoding/decoding and public key methods

- [#15](https://github.com/agentcommercekit/ack/pull/15) [`2ce8d11`](https://github.com/agentcommercekit/ack/commit/2ce8d11998251a7c274239e3dfa85d2afc99576f) Thanks [@venables](https://github.com/venables)! - Add support for ES256 keys in JWTs

## 0.2.0

### Minor Changes

- [#3](https://github.com/agentcommercekit/ack/pull/3) [`4104ffe`](https://github.com/agentcommercekit/ack/commit/4104ffeae34c7ae972b375871feb09bbe5d27b73) Thanks [@venables](https://github.com/venables)! - - Upgrade legacy public key formats to use multibase in DID Documents
  - Update base64 methods to be explicit that they use `base64url` encoding
  - Simplify interface for public key encoding methods

## 0.1.0

### Minor Changes

- Initial release of the Agent Commerce Kit (ACK) TypeScript SDK
