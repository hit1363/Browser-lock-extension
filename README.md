# Secure Browser Lock

Secure Browser Lock is a powerful Chrome extension designed to protect your browser from unauthorized access. With password protection and a convenient one-click lock feature, you can safeguard all open tabs and windows when stepping away from your device. Whether you're working in a shared environment or just want extra peace of mind, this tool ensures your browsing activity remains private and secure.

---

## Features

- **Password Protection**: Set a password to lock and unlock your browser.
- **One-Click Lock**: Quickly lock your browser with a single click.
- **Multi-Language Support**: Supports multiple languages, including English, German, Simplified Chinese, Traditional Chinese, Russian, Hindi, and Japanese.
- **Dark Mode**: Toggle between light and dark themes for a better user experience.
- **Customizable Notifications**: Receive notifications for password updates and errors.

---

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the folder containing the extension files.
5. The extension will now be installed and ready to use.

---

## Usage

### Setting a Password
1. Open the extension's **Options** page.
2. Enter a new password and confirm it.
3. Click **Save** to set your password.

### Locking the Browser
1. Click the extension icon in the Chrome toolbar.
2. Select **Lock Browser** to secure all open tabs and windows.

### Unlocking the Browser
1. Enter your password in the unlock screen.
2. Click **Unlock** to regain access to your browser.

### Changing the Language
1. Use the language selector in the **Options** or **Unlock** page.
2. Select your preferred language from the dropdown menu.
3. The interface will reload with the selected language.

---

## Supported Languages

- English
- Bangla
- Arabic
- Spanish 
- German
- Simplified Chinese
- Traditional Chinese
- Russian
- Hindi
- Japanese
- France 

---

## Development

### File Structure
BROWSEK-LOCK-EXTENSION/
├── _locales/
│   ├── ar/
│   │   └── messages.json
│   ├── bn/
│   │   └── messages.json
│   ├── de/
│   │   └── messages.json
│   ├── en/
│   │   └── messages.json
│   ├── es/
│   │   └── messages.json
│   ├── fr/
│   │   └── messages.json
│   ├── hi/
│   │   └── messages.json
│   ├── ja/
│   │   └── messages.json
│   ├── ru/
│   │   └── messages.json
│   ├── zh-CN/
│   │   └── messages.json
│   └── zh-TW/
│       └── messages.json
├── assets/
│   ├── main.js
│   ├── options.js
│   └── unlock.js
├── css/
│   └── styles.css
├── html/
│   ├── options.html
│   └── unlock.html
├── img/
│   ├── iconslock-16.png
│   ├── iconslock-48.png
│   ├── iconslock-128.png
│   ├── locked.png
│   └── gitattributes
├── LICENSE
└── manifest.json

