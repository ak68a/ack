# AgentID Delegation PoC

Proof-of-concept demonstrating AgentID on-chain delegation verification integrated with ERC-8004 agent discovery and MPP machine payments.

## What it does

1. **Owner** generates an agent identity and registers it on [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) (on-chain agent registry)
2. **Owner** signs a delegation claim — "this agent can spend up to 0.01 ETH on api-access"
3. **Delegation root hash** is stored as ERC-8004 metadata on-chain
4. **Agent** calls a paid API, receives an [MPP](https://mpp.dev/) 402 payment challenge
5. **Agent** pays and submits its delegation proof alongside the payment credential
6. **Server** verifies both: payment settled AND delegation chain is valid (checked against on-chain root)
7. **200** — access granted

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)
- A [Tenderly](https://tenderly.co/) account (free tier works)

## Setup

### 1. Install dependencies

From the repo root:

```bash
pnpm install
```

### 2. Create a Tenderly Virtual TestNet

Get an access token from [Tenderly Dashboard → Settings → Authorization](https://dashboard.tenderly.co/account/authorization).

```bash
cd demos/delegation-poc
TENDERLY_ACCESS_KEY=your_token_here pnpm setup
```

This creates a Sepolia fork with unlimited test ETH and outputs the env vars you need.

### 3. Configure environment

Copy the output from the setup script into `.env`:

```bash
cp .env.example .env
# Paste the values from the setup script
```

## Run

```bash
pnpm demo
```

### Offline mode (no testnet)

The demo works without a Tenderly testnet — it runs the delegation signing and verification locally, and skips the on-chain steps:

```bash
pnpm demo
# (without TENDERLY_RPC_URL set, on-chain steps are skipped)
```

## Architecture

```
Owner (principal)
  │
  ├─ Generates agent keypair
  ├─ Registers agent on ERC-8004 (on-chain)
  ├─ Signs delegation claim (off-chain)
  └─ Stores delegation root hash as ERC-8004 metadata (on-chain)

Agent (delegate)
  │
  ├─ Holds delegation claim (off-chain credential)
  ├─ Calls paid API → receives MPP 402 challenge
  ├─ Pays via testnet ETH transfer
  └─ Submits payment proof + delegation claim

Server (verifier)
  │
  ├─ Issues MPP 402 challenges
  ├─ Verifies payment settlement
  ├─ Reads delegation root from ERC-8004 (on-chain)
  └─ Verifies delegation chain matches on-chain root
```

## Key files

| File | Purpose |
|------|---------|
| `src/delegation.ts` | AgentID delegation model — create, sign, verify claims and chains |
| `src/erc8004.ts` | ERC-8004 IdentityRegistry helpers — register, store/read metadata |
| `src/config.ts` | Chain config, contract addresses, minimal ABI |
| `src/setup-testnet.ts` | One-time Tenderly Virtual TestNet creation + wallet funding |
| `src/index.ts` | Demo orchestrator |

## Testnet details

- **Chain**: Sepolia fork via [Tenderly Virtual TestNet](https://docs.tenderly.co/virtual-testnets)
- **ERC-8004**: Deployed at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (same on all chains)
- **No real money** — all testnet ETH, funded by Tenderly
