# Security Patterns for Tact Smart Contracts

## Table of Contents
- [Carry-Value Pattern](#carry-value-pattern)
- [Bounced Message Handling](#bounced-message-handling)
- [CEI Pattern](#cei-pattern)
- [Access Control](#access-control)
- [Gas Management](#gas-management)
- [Replay Protection](#replay-protection)
- [Integer Serialization](#integer-serialization)
- [Front-Running Prevention](#front-running-prevention)

---

## Carry-Value Pattern

Instead of sending information about value, send the actual value with the message.

**Problem:** In async systems, state can change between request and execution.

```tact
// ❌ BAD: Reference-based (vulnerable)
message WithdrawRequest {
    amount: Int;
}

// ✅ GOOD: Carry actual value
receive(msg: Transfer) {
    // Value is carried with the message itself
    let value = context().value;
    // Process immediately, value is here
}
```

---

## Bounced Message Handling

Always implement `bounced()` handlers to recover funds from failed operations.

```tact
message TransferTokens {
    amount: Int as coins;
    recipient: Address;
}

contract SafeTransfer {
    pendingTransfers: map<Int, PendingTransfer>;
    nextTransferId: Int = 0;

    receive(msg: TransferTokens) {
        // Store pending transfer before sending
        let transferId = self.nextTransferId;
        self.nextTransferId += 1;
        
        self.pendingTransfers.set(transferId, PendingTransfer{
            amount: msg.amount,
            sender: sender()
        });

        // Send with transfer ID for recovery
        send(SendParameters{
            to: msg.recipient,
            value: msg.amount,
            mode: SendPayGasSeparately,
            bounce: true,
            body: TokenDelivery{transferId: transferId}.toCell()
        });
    }

    bounced(msg: bounced<TokenDelivery>) {
        // Recover funds on bounce
        let pending = self.pendingTransfers.get(msg.transferId);
        if (pending != null) {
            send(SendParameters{
                to: pending!!.sender,
                value: pending!!.amount,
                mode: SendIgnoreErrors
            });
            self.pendingTransfers.del(msg.transferId);
        }
    }
}
```

---

## CEI Pattern

**Checks-Effects-Interactions** — perform all checks first, then modify state, then interact with external contracts.

```tact
receive(msg: Withdraw) {
    // 1. CHECKS — validate all conditions
    require(sender() == self.owner, "Not authorized");
    require(msg.amount <= self.balance, "Insufficient balance");
    require(msg.amount > 0, "Amount must be positive");

    // 2. EFFECTS — update state BEFORE external calls
    self.balance -= msg.amount;
    self.withdrawalsCount += 1;

    // 3. INTERACTIONS — external calls last
    send(SendParameters{
        to: sender(),
        value: msg.amount,
        mode: SendRemainingValue | SendIgnoreErrors
    });
}
```

---

## Access Control

### Single Owner

```tact
contract Owned {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    fun requireOwner() {
        require(sender() == self.owner, "Not owner");
    }

    receive(msg: AdminAction) {
        self.requireOwner();
        // ... admin logic
    }
}
```

### Multi-Signature

```tact
struct PendingAction {
    action: Cell;
    approvals: map<Address, Bool>;
    approvalCount: Int;
    timestamp: Int;
}

contract MultiSig {
    owners: map<Address, Bool>;
    threshold: Int;
    pendingActions: map<Int, PendingAction>;

    fun requireOwner() {
        require(self.owners.get(sender()) == true, "Not owner");
    }

    receive(msg: ProposeAction) {
        self.requireOwner();
        // Store pending action
        self.pendingActions.set(msg.actionId, PendingAction{
            action: msg.action,
            approvals: emptyMap(),
            approvalCount: 0,
            timestamp: now()
        });
    }

    receive(msg: ApproveAction) {
        self.requireOwner();
        let pending = self.pendingActions.get(msg.actionId);
        require(pending != null, "Action not found");
        
        // Check not already approved by this owner
        require(pending!!.approvals.get(sender()) != true, "Already approved");
        
        // Record approval
        pending!!.approvals.set(sender(), true);
        pending!!.approvalCount += 1;
        
        // Execute if threshold reached
        if (pending!!.approvalCount >= self.threshold) {
            self.executeAction(pending!!.action);
            self.pendingActions.del(msg.actionId);
        }
    }
}
```

---

## Gas Management

### Explicit Gas Estimation

```tact
const MIN_GAS_FOR_OPERATION: Int = ton("0.05");
const STORAGE_FEE_RESERVE: Int = ton("0.01");

receive(msg: Process) {
    // Check sufficient gas
    require(
        context().value >= MIN_GAS_FOR_OPERATION + STORAGE_FEE_RESERVE,
        "Insufficient gas"
    );

    // Reserve for storage
    nativeReserve(STORAGE_FEE_RESERVE, 0);

    // Process and return excess
    send(SendParameters{
        to: sender(),
        value: 0,
        mode: SendRemainingBalance | SendIgnoreErrors,
        body: "Processed".asComment()
    });
}
```

### Gas-Aware Loops

```tact
// ❌ BAD: Unbounded loop
receive("processAll") {
    foreach(key, value in self.items) {
        // Can run out of gas
    }
}

// ✅ GOOD: Paginated processing
message ProcessBatch {
    startIndex: Int;
    batchSize: Int;
}

receive(msg: ProcessBatch) {
    let processed = 0;
    let index = msg.startIndex;
    
    while (processed < msg.batchSize && index < self.itemCount) {
        // Process item
        index += 1;
        processed += 1;
    }
    
    // Continue if more items
    if (index < self.itemCount) {
        self.reply(ProcessBatch{
            startIndex: index,
            batchSize: msg.batchSize
        }.toCell());
    }
}
```

---

## Replay Protection

Always include unique parameters in signed data to prevent replay attacks.

```tact
message SignedAction {
    action: Cell;
    nonce: Int as uint64;
    validUntil: Int as uint32;
    signature: Slice;
}

contract WithReplayProtection {
    usedNonces: map<Int, Bool>;
    
    receive(msg: SignedAction) {
        // Check expiration
        require(now() <= msg.validUntil, "Signature expired");
        
        // Check nonce not used
        require(self.usedNonces.get(msg.nonce) != true, "Nonce already used");
        
        // Verify signature includes all critical params
        let dataToSign = beginCell()
            .storeRef(msg.action)
            .storeUint(msg.nonce, 64)
            .storeUint(msg.validUntil, 32)
            .storeAddress(myAddress()) // Include contract address!
            .endCell();
        
        require(checkSignature(dataToSign.hash(), msg.signature, self.publicKey), "Invalid signature");
        
        // Mark nonce as used
        self.usedNonces.set(msg.nonce, true);
        
        // Execute action
        self.executeAction(msg.action);
    }
}
```

---

## Integer Serialization

Always use explicit serialization to prevent size mismatches.

```tact
// ❌ BAD: Default Int (257-bit signed)
message BadTransfer {
    amount: Int; // Incompatible with uint256
}

// ✅ GOOD: Explicit serialization
message GoodTransfer {
    amount: Int as coins;        // Standard for TON amounts
    count: Int as uint32;        // 32-bit unsigned
    timestamp: Int as uint64;    // 64-bit timestamp
    queryId: Int as uint64;      // Standard query ID
}
```

### Common Serialization Types

| Type | Use Case |
|------|----------|
| `as coins` | TON/Jetton amounts (variable length) |
| `as uint32` | Counters, indexes |
| `as uint64` | Query IDs, timestamps |
| `as uint256` | Large values, hashes |
| `as int32` | Signed small integers |

---

## Front-Running Prevention

Include recipient address in signed data to prevent transaction interception.

```tact
message SecureTransfer {
    to: Address;
    amount: Int as coins;
    signature: Slice;
}

receive(msg: SecureTransfer) {
    // Signature must include specific recipient
    let data = beginCell()
        .storeAddress(msg.to)  // Recipient is part of signed data
        .storeCoins(msg.amount)
        .storeAddress(sender()) // Sender too
        .endCell();
    
    require(checkSignature(data.hash(), msg.signature, self.publicKey), "Invalid");
    
    send(SendParameters{
        to: msg.to,
        value: msg.amount,
        mode: SendIgnoreErrors
    });
}
```

---

## Emergency Stop (Kill Switch)

```tact
contract Pausable {
    paused: Bool = false;
    owner: Address;

    fun requireNotPaused() {
        require(!self.paused, "Contract is paused");
    }

    fun requireOwner() {
        require(sender() == self.owner, "Not owner");
    }

    receive("pause") {
        self.requireOwner();
        self.paused = true;
    }

    receive("unpause") {
        self.requireOwner();
        self.paused = false;
    }

    receive(msg: SensitiveOperation) {
        self.requireNotPaused();
        // ... operation logic
    }
}
```
