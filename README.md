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
```
BROWSER-LOCK-EXTENSION/
│
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
│
├── assets/
│   ├── main.js
│   ├── options.js
│   └── unlock.js
│
├── css/
│   └── styles.css
│
├── html/
│   ├── options.html
│   └── unlock.html
│
├── img/
│   ├── iconslock-16.png
│   ├── iconslock-48.png
│   ├── iconslock-128.png
│   └── locked.png
│
├── .gitattributes
├── LICENSE
└── manifest.json
```


### Adding a New Language
1. Create a new folder in `_locales` with the language code (e.g., `fr` for French).
2. Add a `messages.json` file with translations for all keys.
3. Update the language selector in `options.html` and `unlock.html` to include the new language.

---

## Contributing

Contributions are welcome! If you'd like to add features, fix bugs, or improve the extension, feel free to submit a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Icons by [Flaticon](https://www.flaticon.com/free-icons/locked).

---

## Screenshots

### Options Page
![image](https://github.com/user-attachments/assets/dd12f4f5-ae43-451b-ab92-9b8b509a965a)
![image](https://github.com/user-attachments/assets/dcc04f4e-f640-41e5-a3a1-fe23f40ad0c1)


### Unlock Page
![image](https://github.com/user-attachments/assets/f802db56-b361-40a4-8648-be35130027a4)
![image](https://github.com/user-attachments/assets/ef2eea44-234a-4183-85e3-e5b916da8280)
