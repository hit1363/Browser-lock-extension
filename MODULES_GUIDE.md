# Shared Modules Reference Guide

## Toast Notifications (`assets/toast.js`)

### Usage:
```javascript
// Show different types of toasts
Toast.success("Operation completed!");
Toast.error("Something went wrong!");
Toast.warning("Please be careful!");
Toast.info("Here's some information");

// Custom configuration
Toast.show("Custom message", {
    type: 'success',
    duration: 5000,  // milliseconds
    autoClose: true
});

// Manually close a toast
const toast = document.querySelector('.toast');
Toast.close(toast);
```

## Theme Manager (`assets/theme.js`)

### Usage:
```javascript
// Auto-initializes on page load
// No manual initialization needed!

// Programmatic control (optional):
Theme.toggle();           // Toggle dark/light mode
Theme.enableDarkMode();   // Force dark mode
Theme.disableDarkMode();  // Force light mode
Theme.isDarkMode();       // Check current mode (returns boolean)
```

## Utilities (`assets/utils.js`)

### Password Validation:
```javascript
const validation = Utils.validatePasswordStrength("MyPass123!");
// Returns: { isValid: true, message: "Strong password", strength: "strong" }

if (!validation.isValid) {
    Toast.error(validation.message);
}
```

### Input Sanitization:
```javascript
const cleanInput = Utils.sanitizeInput(userInput);
// Automatically trims whitespace
```

### Password Toggle Buttons:
```javascript
// Initialize all password toggle buttons
Utils.initPasswordToggles();

// Custom selector
Utils.initPasswordToggles('.my-custom-toggle');
```

### Clipboard Operations:
```javascript
// Copy to clipboard
const success = await Utils.copyToClipboard("Text to copy");
if (success) {
    Toast.success("Copied!");
}
```

### File Downloads:
```javascript
// Download text as file
Utils.downloadText(
    "File content here",
    "filename.txt",
    "text/plain"  // optional, defaults to text/plain
);
```

### Debouncing:
```javascript
// Debounce a function
const debouncedSearch = Utils.debounce((query) => {
    performSearch(query);
}, 300);  // 300ms delay

input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

## Language Switcher (`assets/language-switcher.js`)

### Usage:
```javascript
// Initialize with custom UI update callback
LanguageSwitcher.init(async (getMsg) => {
    // Update UI elements with translated messages
    document.querySelector('.title').textContent = getMsg('title_key');
    document.querySelector('#input').placeholder = getMsg('placeholder_key');
});

// Get current language
const currentLang = LanguageSwitcher.getCurrentLanguage();

// Get translated message
const message = await LanguageSwitcher.getMessage('message_key');

// Update UI manually
await LanguageSwitcher.updateUI((getMsg) => {
    // Your update logic here
});
```

## Including Modules in HTML

Add these script tags before your main script:

```html
<head>
    <!-- Shared Modules -->
    <script src="../assets/toast.js"></script>
    <script src="../assets/theme.js"></script>
    <script src="../assets/utils.js"></script>
    <script src="../assets/language-switcher.js"></script>
    
    <!-- Your main script -->
    <script type="module" src="../assets/your-script.js"></script>
</head>
```

## Best Practices

### 1. Toast Notifications:
- Use appropriate types (success, error, warning, info)
- Keep messages concise and actionable
- Use longer duration for important messages

### 2. Password Validation:
- Always validate on client-side before sending to background
- Show real-time feedback as user types
- Display strength indicators for better UX

### 3. Theme Management:
- Theme automatically persists in localStorage
- No need to manually save/load theme state
- Theme is applied before page render (no flash)

### 4. Language Switching:
- Language preference persists in localStorage
- Falls back to browser language if no preference set
- Falls back to English if translation not available

### 5. Utilities:
- Always sanitize user input before processing
- Use debounce for expensive operations (search, API calls)
- Prefer Utils.copyToClipboard over manual clipboard API

## Migration from Old Code

### Replace Toast Implementation:
```javascript
// OLD (duplicated in each file)
const Toast = (() => { /* ... */ })();

// NEW (use shared module)
// Just remove the old code, Toast is loaded from toast.js
```

### Replace Theme Code:
```javascript
// OLD
let darkmode = localStorage.getItem("darkmode");
const enableDarkMode = () => { /* ... */ };
// ...

// NEW (loaded from theme.js)
// Remove all theme-related code, it auto-initializes
```

### Replace Password Validation:
```javascript
// OLD
const validatePasswordStrength = (password) => { /* ... */ };

// NEW
const validation = Utils.validatePasswordStrength(password);
```

### Replace Password Toggles:
```javascript
// OLD (manual implementation for each toggle)
toggleButtons.forEach(button => { /* ... */ });

// NEW (one line)
Utils.initPasswordToggles();
```

## Troubleshooting

### Toast not showing:
- Ensure `toast.js` is loaded before your script
- Check console for JavaScript errors
- Verify CSS includes toast styles

### Theme not persisting:
- Check localStorage permissions
- Ensure theme.js is loaded
- Verify no other scripts conflict with localStorage

### Language switching not working:
- Ensure language-switcher.js is loaded
- Check that locale files exist in `_locales/[lang]/messages.json`
- Verify manifest.json includes locale resources

### Utils functions undefined:
- Ensure utils.js is loaded before your script
- Check script loading order in HTML
- Verify no script errors prevent Utils initialization
