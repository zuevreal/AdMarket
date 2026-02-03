# Message Passing Patterns in Tact

## Table of Contents
- [Message Structure](#message-structure)
- [Sending Messages](#sending-messages)
- [Receiving Messages](#receiving-messages)
- [Contract Deployment](#contract-deployment)
- [Jetton Transfers](#jetton-transfers)
- [NFT Transfers](#nft-transfers)
- [Query-Response Pattern](#query-response-pattern)
- [Forwarding Pattern](#forwarding-pattern)

---

## Message Structure

Messages in Tact consist of an opcode (32-bit) and payload.

```tact
// Define message with custom opcode
message(0x7362d09c) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

// Simple message (auto-generated opcode)
message Deposit {
    amount: Int as coins;
}
```

### Standard Opcodes

| Operation | Opcode | Description |
|-----------|--------|-------------|
| Jetton Transfer | `0x0f8a7ea5` | TEP-74 transfer |
| Jetton Transfer Notification | `0x7362d09c` | TEP-74 notification |
| NFT Transfer | `0x5fcc3d14` | TEP-62 transfer |
| Excesses | `0xd53276db` | Return remaining gas |

---

## Sending Messages

### Basic Send

```tact
send(SendParameters{
    to: recipient,
    value: ton("1"),
    mode: SendIgnoreErrors,
    body: SomeMessage{field: 123}.toCell()
});
```

### Send Modes

```tact
// Mode flags
const SendPayGasSeparately: Int = 1;   // Pay gas from value
const SendIgnoreErrors: Int = 2;        // Ignore errors
const SendDestroyIfZero: Int = 32;      // Destroy if balance = 0
const SendRemainingValue: Int = 64;     // Forward remaining msg value
const SendRemainingBalance: Int = 128;  // Send entire balance

// Common combinations
SendRemainingValue | SendIgnoreErrors    // Forward excess gas
SendRemainingBalance | SendDestroyIfZero // Send all and destroy
```

### Reply to Sender

```tact
// Simple reply
self.reply("Success".asComment());

// Typed reply
self.reply(TransferResult{
    success: true,
    balance: self.balance
}.toCell());

// Forward remaining value
self.forward(sender(), "Done".asComment(), true, null);
```

### Notify with Forward

```tact
// Send notification with value forward
self.notify(TransferNotification{
    queryId: msg.queryId,
    amount: msg.amount,
    sender: sender(),
    forwardPayload: msg.forwardPayload
}.toCell());
```

---

## Receiving Messages

### Typed Message Receiver

```tact
receive(msg: TokenTransfer) {
    require(sender() == self.jettonWallet, "Invalid sender");
    self.balance += msg.amount;
    
    // Forward notification if requested
    if (msg.forwardAmount > 0) {
        send(SendParameters{
            to: msg.destination,
            value: msg.forwardAmount,
            mode: SendPayGasSeparately,
            body: TransferNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: sender(),
                forwardPayload: msg.forwardPayload
            }.toCell()
        });
    }
}
```

### Text Message Receiver

```tact
// Receive specific text command
receive("mint") {
    self.requireOwner();
    self.mint();
}

// Receive any text
receive(comment: String) {
    // Parse and handle text commands
    if (comment == "help") {
        self.sendHelp();
    }
}
```

### Empty Message Receiver

```tact
// Receive empty message (just gas)
receive() {
    // Accept incoming TON as deposit
}
```

### Fallback Receiver

```tact
// Handle unknown messages
receive(msg: Slice) {
    // Log or reject unknown messages
    throw(0xFFFF); // Unknown operation
}
```

---

## Contract Deployment

### Deploy from Factory

```tact
contract Factory {
    childCode: Cell;
    
    init(childCode: Cell) {
        self.childCode = childCode;
    }
    
    receive(msg: CreateChild) {
        let init = initOf ChildContract(msg.owner, msg.param);
        let address = contractAddress(init);
        
        deploy(DeployParameters{
            init: init,
            value: ton("0.1"),
            mode: SendIgnoreErrors,
            body: InitChild{
                owner: msg.owner
            }.toCell()
        });
        
        // Notify caller of new address
        self.reply(ChildCreated{
            address: address
        }.toCell());
    }
}
```

### Deploy with initOf

```tact
receive(msg: DeployWallet) {
    let init = initOf JettonWallet(sender(), myAddress());
    let walletAddress = contractAddress(init);
    
    send(SendParameters{
        to: walletAddress,
        value: ton("0.05"),
        mode: SendPayGasSeparately,
        code: init.code,
        data: init.data,
        body: InternalDeploy{}.toCell()
    });
}
```

---

## Jetton Transfers

### TEP-74 Transfer Flow

```
User → Sender Wallet → Receiver Wallet → Receiver Contract
         ↓                    ↓
    (burn tokens)      (mint tokens)
```

### Sending Jettons

```tact
message(0x0f8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

fun sendJettons(jettonWallet: Address, to: Address, amount: Int) {
    send(SendParameters{
        to: jettonWallet,
        value: ton("0.1"),
        mode: SendPayGasSeparately,
        body: JettonTransfer{
            queryId: 0,
            amount: amount,
            destination: to,
            responseDestination: myAddress(),
            customPayload: null,
            forwardAmount: ton("0.01"),
            forwardPayload: emptySlice()
        }.toCell()
    });
}
```

### Receiving Jetton Notification

```tact
message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

receive(msg: JettonNotification) {
    // Verify sender is expected jetton wallet
    require(sender() == self.expectedJettonWallet, "Invalid jetton");
    
    // Parse forward payload for custom logic
    if (!msg.forwardPayload.empty()) {
        let operation = msg.forwardPayload.loadUint(32);
        // Handle operation...
    }
    
    // Update state
    self.deposited += msg.amount;
}
```

---

## NFT Transfers

### TEP-62 Transfer

```tact
message(0x5fcc3d14) NftTransfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

fun transferNft(nftAddress: Address, to: Address) {
    send(SendParameters{
        to: nftAddress,
        value: ton("0.05"),
        mode: SendPayGasSeparately,
        body: NftTransfer{
            queryId: 0,
            newOwner: to,
            responseDestination: myAddress(),
            customPayload: null,
            forwardAmount: ton("0.01"),
            forwardPayload: emptySlice()
        }.toCell()
    });
}
```

### Receiving NFT Ownership

```tact
message(0x05138d91) NftOwnershipAssigned {
    queryId: Int as uint64;
    prevOwner: Address;
    forwardPayload: Slice as remaining;
}

receive(msg: NftOwnershipAssigned) {
    // NFT was transferred to this contract
    self.ownedNfts.set(sender(), true);
    
    // Optionally use forward payload for logic
}
```

---

## Query-Response Pattern

### Request-Response

```tact
message GetBalance {
    queryId: Int as uint64;
}

message BalanceResponse {
    queryId: Int as uint64;
    balance: Int as coins;
}

// Requesting contract
contract Requester {
    receive(msg: CheckBalance) {
        send(SendParameters{
            to: msg.target,
            value: ton("0.01"),
            mode: SendPayGasSeparately,
            body: GetBalance{queryId: msg.queryId}.toCell()
        });
    }
    
    receive(msg: BalanceResponse) {
        // Handle response
        // Match queryId to original request if needed
    }
}

// Responding contract
contract Responder {
    balance: Int;
    
    receive(msg: GetBalance) {
        self.reply(BalanceResponse{
            queryId: msg.queryId,
            balance: self.balance
        }.toCell());
    }
}
```

### Excesses Return

```tact
message(0xd53276db) Excesses {
    queryId: Int as uint64;
}

// Always return excesses after operations
fun returnExcesses(to: Address, queryId: Int) {
    send(SendParameters{
        to: to,
        value: 0,
        mode: SendRemainingValue | SendIgnoreErrors,
        body: Excesses{queryId: queryId}.toCell()
    });
}
```

---

## Forwarding Pattern

### Proxy Pattern

```tact
contract Proxy {
    implementation: Address;
    
    receive(msg: Slice) {
        // Forward all messages to implementation
        send(SendParameters{
            to: self.implementation,
            value: 0,
            mode: SendRemainingValue,
            body: beginCell()
                .storeAddress(sender())  // Original sender
                .storeSlice(msg)
                .endCell()
        });
    }
}
```

### Multi-Target Broadcast

```tact
message Broadcast {
    data: Cell;
}

contract Broadcaster {
    receivers: map<Int, Address>;
    receiverCount: Int;
    
    receive(msg: Broadcast) {
        let i = 0;
        while (i < self.receiverCount) {
            let receiver = self.receivers.get(i);
            if (receiver != null) {
                send(SendParameters{
                    to: receiver!!,
                    value: ton("0.01"),
                    mode: SendPayGasSeparately,
                    body: msg.data
                });
            }
            i += 1;
        }
    }
}
```
