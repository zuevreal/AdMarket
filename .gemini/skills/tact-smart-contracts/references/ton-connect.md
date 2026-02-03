# TON Connect Integration Guide

## Table of Contents
- [Overview](#overview)
- [Manifest Configuration](#manifest-configuration)
- [Frontend Integration](#frontend-integration)
- [Transaction Signing](#transaction-signing)
- [Message Encoding](#message-encoding)
- [React Integration](#react-integration)

---

## Overview

TON Connect is the protocol for connecting wallets to dApps on TON blockchain. It enables:

- **Wallet discovery** — finding available wallets
- **Connection** — establishing secure session
- **Transaction signing** — requesting user signatures
- **Message encoding** — formatting blockchain messages

---

## Manifest Configuration

Create `tonconnect-manifest.json` in your app's public directory:

```json
{
    "url": "https://your-app.com",
    "name": "Your dApp Name",
    "iconUrl": "https://your-app.com/icon.png",
    "termsOfUseUrl": "https://your-app.com/terms",
    "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

**Requirements:**
- Must be accessible via direct GET request
- `iconUrl` should be 180x180 PNG
- Use HTTPS only
- Same domain as app URL

---

## Frontend Integration

### Installation

```bash
npm install @tonconnect/ui-react @tonconnect/sdk
```

### Basic Setup (React)

```tsx
import { TonConnectUIProvider, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

// Provider wrapper
function App() {
    return (
        <TonConnectUIProvider manifestUrl="https://your-app.com/tonconnect-manifest.json">
            <YourApp />
        </TonConnectUIProvider>
    );
}

// Using hooks
function WalletButton() {
    const [tonConnectUI] = useTonConnectUI();
    const userAddress = useTonAddress(false); // false = raw address
    
    if (userAddress) {
        return <div>Connected: {userAddress.slice(0, 8)}...</div>;
    }
    
    return (
        <button onClick={() => tonConnectUI.openModal()}>
            Connect Wallet
        </button>
    );
}
```

### Vanilla JavaScript

```typescript
import { TonConnectUI } from '@tonconnect/ui';

const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://your-app.com/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
});

// Listen for connection changes
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        console.log('Connected:', wallet.account.address);
    } else {
        console.log('Disconnected');
    }
});
```

---

## Transaction Signing

### Simple TON Transfer

```tsx
import { useTonConnectUI } from '@tonconnect/ui-react';

function SendTon() {
    const [tonConnectUI] = useTonConnectUI();
    
    const sendTransaction = async () => {
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 60 seconds
            messages: [
                {
                    address: "EQD...recipient",
                    amount: "1000000000", // 1 TON in nanotons
                }
            ]
        };
        
        try {
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log('Transaction sent:', result.boc);
        } catch (error) {
            console.error('Failed:', error);
        }
    };
    
    return <button onClick={sendTransaction}>Send 1 TON</button>;
}
```

### Contract Interaction

```tsx
import { useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, toNano, Address } from '@ton/core';

function InteractWithContract() {
    const [tonConnectUI] = useTonConnectUI();
    
    const callContract = async () => {
        // Build message body
        const body = beginCell()
            .storeUint(0x12345678, 32) // opcode
            .storeUint(0, 64)          // queryId
            .storeCoins(toNano("10"))  // amount parameter
            .endCell();
        
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
                {
                    address: "EQD...contract",
                    amount: toNano("0.05").toString(), // gas
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
        
        await tonConnectUI.sendTransaction(transaction);
    };
    
    return <button onClick={callContract}>Call Contract</button>;
}
```

---

## Message Encoding

### Building Message Body

```typescript
import { beginCell, Address, toNano } from '@ton/core';

// Simple message
const depositBody = beginCell()
    .storeUint(0x12345678, 32)  // opcode
    .storeUint(Date.now(), 64)  // queryId
    .endCell();

// Jetton transfer
const jettonTransferBody = beginCell()
    .storeUint(0x0f8a7ea5, 32)           // jetton transfer opcode
    .storeUint(0, 64)                     // queryId
    .storeCoins(toNano("100"))            // amount
    .storeAddress(Address.parse("EQ...")) // destination
    .storeAddress(Address.parse("EQ...")) // response destination
    .storeBit(0)                          // no custom payload
    .storeCoins(toNano("0.01"))           // forward amount
    .storeBit(0)                          // no forward payload
    .endCell();

// Convert to base64 for TON Connect
const payload = body.toBoc().toString("base64");
```

### Multiple Messages in One Transaction

```typescript
const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
        {
            address: "EQD...contract1",
            amount: toNano("0.05").toString(),
            payload: body1.toBoc().toString("base64")
        },
        {
            address: "EQD...contract2", 
            amount: toNano("0.05").toString(),
            payload: body2.toBoc().toString("base64")
        }
    ]
};
```

---

## React Integration

### Complete Example with State

```tsx
import { 
    TonConnectUIProvider, 
    useTonConnectUI, 
    useTonAddress,
    useTonWallet
} from '@tonconnect/ui-react';
import { beginCell, toNano, Address } from '@ton/core';
import { useState } from 'react';

function App() {
    return (
        <TonConnectUIProvider 
            manifestUrl="/tonconnect-manifest.json"
            actionsConfiguration={{
                twaReturnUrl: 'https://t.me/your_bot'
            }}
        >
            <ContractInterface />
        </TonConnectUIProvider>
    );
}

function ContractInterface() {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const address = useTonAddress();
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    
    const contractAddress = "EQD...your_contract";
    
    const deposit = async (amount: string) => {
        if (!wallet) {
            await tonConnectUI.openModal();
            return;
        }
        
        setLoading(true);
        try {
            const body = beginCell()
                .storeUint(0x12345678, 32) // deposit opcode
                .storeUint(Date.now(), 64) // queryId
                .endCell();
            
            const result = await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: contractAddress,
                    amount: toNano(amount).toString(),
                    payload: body.toBoc().toString("base64")
                }]
            });
            
            setTxHash(result.boc);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Cancelled')) {
                console.log('User cancelled');
            } else {
                console.error('Transaction failed:', error);
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            {wallet ? (
                <div>
                    <p>Connected: {address?.slice(0, 8)}...</p>
                    <button 
                        onClick={() => deposit("1")} 
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Deposit 1 TON'}
                    </button>
                    <button onClick={() => tonConnectUI.disconnect()}>
                        Disconnect
                    </button>
                    {txHash && <p>TX: {txHash.slice(0, 20)}...</p>}
                </div>
            ) : (
                <button onClick={() => tonConnectUI.openModal()}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
}
```

### Telegram Mini App Integration

```tsx
import { TonConnectUIProvider } from '@tonconnect/ui-react';

function TelegramMiniApp() {
    return (
        <TonConnectUIProvider
            manifestUrl="/tonconnect-manifest.json"
            actionsConfiguration={{
                // Return to Telegram after transaction
                twaReturnUrl: 'https://t.me/your_bot/app'
            }}
            walletsListConfiguration={{
                // Optional: include specific wallets
                includeWallets: [
                    {
                        name: 'Tonkeeper',
                        bridgeUrl: 'https://bridge.tonkeeper.com',
                        universalLink: 'https://app.tonkeeper.com/ton-connect',
                        aboutUrl: 'https://tonkeeper.com'
                    }
                ]
            }}
        >
            <App />
        </TonConnectUIProvider>
    );
}
```

---

## Error Handling

```typescript
try {
    await tonConnectUI.sendTransaction(transaction);
} catch (error) {
    if (error instanceof TonConnectError) {
        switch (error.code) {
            case CONNECT_ERROR_CODES.USER_REJECTS_ERROR:
                console.log('User rejected');
                break;
            case CONNECT_ERROR_CODES.BAD_REQUEST_ERROR:
                console.log('Invalid transaction');
                break;
            case CONNECT_ERROR_CODES.UNKNOWN_ERROR:
                console.log('Wallet error');
                break;
        }
    }
}
```

---

## Best Practices

1. **Always set `validUntil`** — prevents old transactions from being executed
2. **Handle disconnection** — wallet can disconnect at any time
3. **Show loading states** — transactions take time to confirm
4. **Validate addresses** — use `Address.parse()` with try/catch
5. **Gas estimation** — always send enough for contract operations
6. **Telegram return URL** — set `twaReturnUrl` for Mini Apps
