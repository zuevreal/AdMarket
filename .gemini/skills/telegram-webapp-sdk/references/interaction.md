# Interaction & Feedback

## Haptic Feedback

Crucial for "feeling" like a native app. Use for every significant user interaction.

### Impact
Collision style feedback.

```typescript
// Styles: 'light', 'medium', 'heavy', 'rigid', 'soft'
WebApp.HapticFeedback.impactOccurred('medium');
```

- `'light'`: Generic button tap
- `'medium'`: Selecting an item
- `'heavy'`: Big action (like MainButton press)

### Notification
Feedback for success/failure.

```typescript
// Types: 'error', 'success', 'warning'
WebApp.HapticFeedback.notificationOccurred('success');
```

- `'success'`: Form submitted
- `'error'`: Validation failed
- `'warning'`: Delete confirmation

### Selection
Changing selection (like a picker wheel).

```typescript
WebApp.HapticFeedback.selectionChanged();
```

---

## Popups

Native confirm/alert dialogs.

```typescript
WebApp.showPopup({
    title: 'Delete Item?',
    message: 'Are you sure you want to delete this item?',
    buttons: [
        {id: 'delete', type: 'destructive', text: 'Delete'},
        {id: 'cancel', type: 'cancel'}
    ]
}, function(buttonId) {
    if (buttonId === 'delete') {
        // Handle delete
    }
});
```

`buttons` types: `'default'`, `'ok'`, `'close'`, `'cancel'`, `'destructive'`.

---

## QR Scanner

Trigger native QR scanner.

```typescript
WebApp.showScanQrPopup({
    text: 'Scan the payment QR'
}, function(text) {
    // Handle scanned text
    console.log(text);
    return true; // Return true to close popup
});
```

---

## Closing App

```typescript
WebApp.close();
```

## Confirmation on Close

Show a confirmation dialog when user tries to close the app with unsaved changes.

```typescript
WebApp.enableClosingConfirmation();
// or
WebApp.disableClosingConfirmation();
```
