---
name: telegram-webapp-sdk
description: Guide for developing Telegram Mini Apps using the WebApp SDK. Use when creating web interfaces for Telegram bots, handling MainButton/BackButton, managing themes, or implementing HapticFeedback.
---

# Telegram WebApp SDK

## Overview

The Telegram WebApp SDK allows you to build rich integrations that feel native (Mini Apps). Note that `window.Telegram.WebApp` is the main entry point.

## Quick Start

### 1. Script Inclusion

Add the script to your `index.html` `head`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2. Initialization

```typescript
// Define global types if using TypeScript
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

// Access the WebApp object
const webApp = window.Telegram.WebApp;

// Notify Telegram that the app is ready
webApp.ready();

// Expand to full height (optional)
webApp.expand();
```

## React Integration

It is recommended to use the SDK wrapper for React: `@twa-dev/sdk`

```bash
npm install @twa-dev/sdk
```

```tsx
import WebApp from '@twa-dev/sdk';

function App() {
  return (
    <div>
       <h1>User: {WebApp.initDataUnsafe.user?.first_name}</h1>
       <button onClick={() => WebApp.showAlert('Hello!')}>
         Show Alert
       </button>
    </div>
  );
}
```

## Core Components

### UI Components
Control native buttons like `MainButton` and `BackButton`.
👉 See [references/ui-components.md](references/ui-components.md)

### Theming
Adapt to user's Telegram theme colors (`themeParams`).
👉 See [references/theming.md](references/theming.md)

### Interaction
Haptic feedback, popups, and QR scanning.
👉 See [references/interaction.md](references/interaction.md)

## Critical Rules

> [!IMPORTANT]
> **Always call `ready()`**: You must call `window.Telegram.WebApp.ready()` as early as possible to signal the app has loaded.

> [!WARNING]
> **Verify `initData`**: Never trust `initData` or `initDataUnsafe` on the client side for sensitive operations. Always verify the signature on the backend.

> [!TIP]
> **Use Haptics**: Always add haptic feedback to interactive elements to make the app feel native.
