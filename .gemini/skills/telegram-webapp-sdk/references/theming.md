# Theming & Color Schemes

Telegram passes theme information to the Web App so it can look native.

## Theme Parameters (`themeParams`)

The `WebApp.themeParams` object contains the current color palette.

| Parameter | CSS Variable | Description |
|-----------|--------------|-------------|
| `bg_color` | `--tg-theme-bg-color` | Page background color |
| `text_color` | `--tg-theme-text-color` | Main text color |
| `hint_color` | `--tg-theme-hint-color` | Secondary text color |
| `link_color` | `--tg-theme-link-color` | Link color |
| `button_color` | `--tg-theme-button-color` | Main button background |
| `button_text_color` | `--tg-theme-button-text-color` | Main button text |
| `secondary_bg_color` | `--tg-theme-secondary-bg-color` | Secondary background (list items) |
| `header_bg_color` | `--tg-theme-header-bg-color` | Header background |
| `accent_text_color` | `--tg-theme-accent-text-color` | Accent/Blue text |

### CSS Usage

The SDK automatically sets CSS variables on the `<body>` element. You can use them directly:

```css
body {
  background-color: var(--tg-theme-bg-color);
  color: var(--tg-theme-text-color);
}

.card {
  background-color: var(--tg-theme-secondary-bg-color);
}

.link {
  color: var(--tg-theme-link-color);
}
```

### React/JS Usage

```typescript
const theme = WebApp.themeParams;

const styles = {
  backgroundColor: theme.bg_color,
  color: theme.text_color
};
```

## Handling Theme Changes

Theme usage can change at any time (if user switches system theme).

```typescript
WebApp.onEvent('themeChanged', function() {
  // Refresh colors if rendering manually
  // CSS variables update automatically
});
```

## Header Color

You can customize the Mini App header bar color.

```typescript
// Set to predefined theme color
WebApp.setHeaderColor('secondary_bg_color');

// Set to custom hex
WebApp.setHeaderColor('#ff0000');
```

## Background Color

```typescript
WebApp.setBackgroundColor('#ffffff');
```
