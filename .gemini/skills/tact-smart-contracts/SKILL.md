---
name: tact-smart-contracts
description: Guide for developing secure smart contracts on TON blockchain using Tact language. Use when creating, auditing, or modifying Tact smart contracts, implementing messaging patterns between contracts, integrating with TON Connect, handling Jettons/NFTs, or applying security best practices for asynchronous blockchain architecture.
---

# Tact Smart Contracts Development

## Overview

This skill provides comprehensive guidance for developing secure and efficient smart contracts on the TON blockchain using the Tact programming language. It covers security patterns, message passing, TON Connect integration, and common contract templates.

## Quick Start

Basic contract structure in Tact:

```tact
import "@stdlib/deploy";

contract MyContract with Deployable {
    owner: Address;
    balance: Int as uint256;

    init(owner: Address) {
        self.owner = owner;
        self.balance = 0;
    }

    receive("deposit") {
        self.balance += context().value;
    }

    receive("withdraw") {
        require(sender() == self.owner, "Only owner");
        send(SendParameters{
            to: self.owner,
            value: self.balance,
            mode: SendRemainingValue | SendIgnoreErrors
        });
    }

    get fun balance(): Int {
        return self.balance;
    }
}
```

## Core Concepts

### TON's Asynchronous Model

TON uses an **Actor model** where each contract is an independent actor that communicates via asynchronous messages. Key implications:

1. **No synchronous calls** — all inter-contract communication is via messages
2. **Unpredictable delivery order** — messages may take 1-100 seconds
3. **No reentrancy** — but race conditions are possible
4. **Carry-value pattern** — send actual value, not references to it

### Message Types

| Type | Description | Handler |
|------|-------------|---------|
| Internal | From other contracts | `receive(msg: Msg)` |
| External | From off-chain (no sender) | `external(msg: Msg)` |
| Bounced | Failed message returns | `bounced(msg: bounced<Msg>)` |

### Send Modes

```tact
// Common mode combinations
SendRemainingValue | SendIgnoreErrors  // Forward remaining gas
SendRemainingBalance | SendDestroyIfZero  // Send all and destroy if empty
```

## Security Patterns

For detailed security patterns, see [references/security-patterns.md](references/security-patterns.md), which covers:

- **Carry-Value Pattern** — защита от race conditions
- **Bounced Message Handling** — восстановление средств
- **CEI Pattern** — Checks-Effects-Interactions order
- **Owner Verification** — multi-sig and access control
- **Gas Management** — explicit estimation, storage fees
- **Replay Protection** — signatures with unique parameters

## Message Passing

For inter-contract communication patterns, see [references/message-passing.md](references/message-passing.md), which covers:

- Message structure and opcodes
- Contract deployment via messages
- Jetton transfer flows
- NFT transfer patterns
- Query/response patterns

## TON Connect Integration

For wallet integration, see [references/ton-connect.md](references/ton-connect.md), which covers:

- Manifest configuration
- Transaction signing flow
- Message encoding for dApps
- React/TypeScript integration patterns

## Common Templates

### Jetton Wallet (TEP-74)

```tact
import "@stdlib/jetton";

contract JettonWallet with JettonDefaultWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
    }
}
```

### NFT Item (TEP-62)

```tact
import "@stdlib/nft";

contract NftItem with NftItemStandard {
    collection: Address;
    index: Int;
    owner: Address;
    content: Cell;

    init(collection: Address, index: Int, owner: Address, content: Cell) {
        self.collection = collection;
        self.index = index;
        self.owner = owner;
        self.content = content;
    }
}
```

## Testing & Deployment

### Local Testing with Blueprint

```bash
# Run tests
npx blueprint test

# Deploy to testnet
npx blueprint run --testnet
```

### Contract Verification

1. Always test on testnet first
2. Use `ton-contract-verifier` for source verification
3. Verify gas consumption with `tonalytica`

## Critical Rules

> [!CAUTION]
> **Never trust message order** — design contracts assuming messages arrive in any order.

> [!WARNING]
> **Always handle bounced messages** — implement `bounced()` handlers to recover funds from failed operations.

> [!IMPORTANT]
> **Use explicit serialization** — always specify `as uint32`, `as coins` etc. to avoid size mismatches between contracts.
