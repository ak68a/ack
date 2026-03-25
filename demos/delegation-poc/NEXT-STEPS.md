# Delegation PoC — Next Steps

## What works now

Full end-to-end flow on Tenderly Sepolia fork:
1. Owner signs delegation claim (secp256k1, keccak256)
2. Agent registers on ERC-8004 (Agent ID 2279 on current fork)
3. Delegation root hash anchored as ERC-8004 metadata
4. Server issues MPP 402 challenge
5. Agent pays 0.001 ETH + submits delegation proof
6. Server verifies: payment tx, delegation signature, action/scope, on-chain root match
7. 200 — access granted

Tenderly project: https://dashboard.tenderly.co/ak68a/agentid
Virtual TestNet: "AgentID PoC (Sepolia Fork)", chain ID 73571

## Polish before sharing

- [ ] Add `--mock` flag to run without Tenderly (server + agent work, skip on-chain)
- [ ] Add error handling for common failures (network down, wallet empty, etc.)
- [ ] Record a terminal session (asciinema or screenshot) for the README
- [ ] Run `pnpm run check` from repo root to make sure demo doesn't break CI

## Demo improvements

- [ ] Add a negative case: agent with wrong delegation (wrong action/scope) gets rejected
- [ ] Add a revoked delegation case: delegation root removed from ERC-8004, server rejects
- [ ] Add chain depth test: owner → agent A → agent B (two-level delegation)
- [ ] Pretty-print the 402 challenge in the demo output (currently just logged as "402 → 200")

## Toward production

- [ ] Extract `delegation.ts` into its own npm package (`@agentid/delegation` or similar)
- [ ] Implement the AgentID ValidationRegistry validator contract (Solidity) — verifies delegation chains and posts to ERC-8004 ValidationRegistry
- [ ] Add MPP `mppx` SDK integration instead of manual 402 header parsing
- [ ] Test on real Sepolia (not just Tenderly fork)
- [ ] Test cross-language interop: Go AgentID signs, TypeScript PoC verifies (golden vectors)

## Community sharing

- [ ] Post to ACK Discord (draft in `agentid/.planning/announcements.md`)
- [ ] Post to ERC-8004 community (draft in `agentid/.planning/announcements.md`)
- [ ] Post LinkedIn announcement (draft in `agentid/.planning/announcements.md`)
- [ ] Open issue on erc-8004-contracts repo proposing delegation metadata standard

## Env setup for next session

Tenderly Virtual TestNet is already running. To resume:

```bash
cd demos/delegation-poc
pnpm demo          # runs with .env (Tenderly)
pnpm demo:mock     # runs without Tenderly (offline mode)
```

If the VNet expired, recreate it:
```bash
TENDERLY_ACCESS_KEY=xxx pnpm setup
# Copy output into .env
```
