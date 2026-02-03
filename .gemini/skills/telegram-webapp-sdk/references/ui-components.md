# UI Components

## MainButton

The large button at the bottom of the Web App interface.

### Methods

```typescript
// Show the button
WebApp.MainButton.show();

// Hide the button
WebApp.MainButton.hide();

// Set text
WebApp.MainButton.setText("CONTINUE");

// Set color (hex only)
WebApp.MainButton.setParams({
  text_color: "#ffffff",
  color: "#2481cc"
});

// Show loading spinner
WebApp.MainButton.showProgress(); // leaves text visible? No, usually replaces text or adds spinner
// Usually:
WebApp.MainButton.showProgress(false); // keep text? No param for showProgress in v6.9+
// Actually: MainButton.showProgress(leaveActive: boolean)
```

### Event Handling

```typescript
WebApp.onEvent('mainButtonClicked', function() {
  WebApp.MainButton.showProgress(true);
  // Perform action...
  WebApp.MainButton.hideProgress();
});
```

### React Example

```tsx
import { MainButton } from '@twa-dev/sdk/react'; // Hypothetical wrapper or use SDK directly

useEffect(() => {
  WebApp.MainButton.setText("Submit Order");
  WebApp.MainButton.show();
  
  const handleClick = () => {
    // Handle click
  };
  
  WebApp.onEvent('mainButtonClicked', handleClick);
  return () => {
    WebApp.offEvent('mainButtonClicked', handleClick);
    WebApp.MainButton.hide();
  };
}, []);
```

---

## BackButton

Navigation button in the header.

### Methods

```typescript
// Show/Hide
WebApp.BackButton.show();
WebApp.BackButton.hide();
```

### Event Handling

```typescript
WebApp.onEvent('backButtonClicked', function() {
  // Handle back navigation
  // e.g. history.back() or router.back()
});
```

---

## SettingsButton

Helper button in the header (3 dots context menu usually handles this, but SettingsButton is explicit).

```typescript
WebApp.SettingsButton.show();
WebApp.onEvent('settingsButtonClicked', () => {
  // Open settings
});
```
