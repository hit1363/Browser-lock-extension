// Import Toast notification system
const Toast = (() => {
    let container = null;

    return {
        init() {
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
        },

        show(message, options = {}) {
            this.init();
            const { type = 'default', duration = 3000, autoClose = true } = options;
            const toast = document.createElement('div');
            toast.className = `toast toast-${type} toast-top-right`;
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ',
                default: '●'
            };
            
            toast.innerHTML = `
                <div class="toast-icon">${icons[type] || icons.default}</div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" aria-label="Close notification">×</button>
            `;

            container.appendChild(toast);
            setTimeout(() => toast.classList.add('toast-show'), 10);

            toast.querySelector('.toast-close').addEventListener('click', () => this.close(toast));

            if (autoClose && duration > 0) {
                setTimeout(() => this.close(toast), duration);
            }
        },

        close(toast) {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        },

        success(message, options = {}) {
            this.show(message, { ...options, type: 'success' });
        },

        error(message, options = {}) {
            this.show(message, { ...options, type: 'error' });
        },

        warning(message, options = {}) {
            this.show(message, { ...options, type: 'warning' });
        },

        info(message, options = {}) {
            this.show(message, { ...options, type: 'info' });
        }
    };
})();

/** @type {string|null} Current dark mode preference from localStorage */
let darkmode = localStorage.getItem("darkmode");

/**
 * Enables dark mode by adding CSS class and storing preference
 * @returns {void}
 */
const enableDarkMode = () => {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkmode", "active");
};

/**
 * Disables dark mode by removing CSS class and clearing preference
 * @returns {void}
 */
const disableDarkMode = () => {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkmode", null);
};

if (darkmode === "active") {
    enableDarkMode();
}

// Initialize theme toggle after DOM is ready
const themeToggle = document.querySelector(".theme-toggle");
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        darkmode = localStorage.getItem("darkmode");
        darkmode !== "active" ? enableDarkMode() : disableDarkMode();
    });
}

/** @type {Object|null} Extension configuration from storage */
let config;

const blo = {
    /**
     * Initializes the options page UI and event listeners
     * @returns {Promise<void>}
     */
    init: async () => {
        ["click", "input", "keydown"].forEach(eventType =>
            window.addEventListener(eventType, blo.handleEvent, false)
        );

        const configMap = {
            placeholders: {
                ".password-input#passwd-last": chrome.i18n.getMessage("title_last_passwd"),
                ".password-input#passwd-new": chrome.i18n.getMessage("title_new_passwd"),
                ".password-input#passwd-new-check": chrome.i18n.getMessage("title_new_check_passwd"),
            },
            textContent: {
                ".password-title": config?.passwd
                    ? chrome.i18n.getMessage("title_change_passwd")
                    : chrome.i18n.getMessage("title_set_passwd"),
                ".button": chrome.i18n.getMessage("btn_save"),
                "#link-review": chrome.i18n.getMessage("link_review"),
                "#link-source": chrome.i18n.getMessage("link_source"),
            },
            htmlContent: {
                ".first-user-notification": chrome.i18n.getMessage("notif_first"),
            },
            attributes: {
                "#link-review": { href: "https://github.com/hit1363/Browser-lock-extension" },
                "#link-source": { href: "https://github.com/hit1363/Browser-lock-extension" },
            },
            styles: {
                ".password-input#passwd-last": { display: config?.passwd ? "flex" : "none" },
                ".first-user-notification": { display: config?.passwd ? "none" : "flex" },
            },
        };

        Object.entries(configMap.placeholders).forEach(([selector, message]) => {
            document.querySelector(selector).placeholder = message;
        });
        Object.entries(configMap.textContent).forEach(([selector, message]) => {
            document.querySelector(selector).innerText = message;
        });
        Object.entries(configMap.htmlContent).forEach(([selector, message]) => {
            document.querySelector(selector).innerHTML = message;
        });
        Object.entries(configMap.attributes).forEach(([selector, attributes]) => {
            const element = document.querySelector(selector);
            Object.entries(attributes).forEach(([attr, value]) => element.setAttribute(attr, value));
        });
        Object.entries(configMap.styles).forEach(([selector, styles]) => {
            Object.assign(document.querySelector(selector).style, styles);
        });

        // Initialize password visibility toggles
        blo.initPasswordToggles();

        // Add direct event listener to save button
        const saveButton = document.querySelector("#btn-save");
        if (saveButton) {
            saveButton.addEventListener("click", () => {
                blo.passwd();
            });
        }
    },

    /**
     * Initialize password visibility toggle buttons
     */
    initPasswordToggles: () => {
        const toggleButtons = document.querySelectorAll(".toggle-password");
        toggleButtons.forEach(button => {
            button.addEventListener("click", function() {
                const targetId = this.getAttribute("data-target");
                const targetInput = document.getElementById(targetId);
                const eyeIcon = this.querySelector(".eye-icon");
                const eyeOffIcon = this.querySelector(".eye-off-icon");

                if (targetInput.type === "password") {
                    targetInput.type = "text";
                    eyeIcon.style.display = "none";
                    eyeOffIcon.style.display = "block";
                    this.setAttribute("aria-label", chrome.i18n.getMessage("toggle_hide_password") || "Hide password");
                } else {
                    targetInput.type = "password";
                    eyeIcon.style.display = "block";
                    eyeOffIcon.style.display = "none";
                    this.setAttribute("aria-label", chrome.i18n.getMessage("toggle_show_password") || "Show password");
                }
            });
        });

        // Show/hide toggle button for passwd-last based on visibility
        const passwdLastWrapper = document.querySelector('[data-target="passwd-last"]');
        if (passwdLastWrapper) {
            passwdLastWrapper.style.display = config?.passwd ? "flex" : "none";
        }
    },

    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} - {isValid: boolean, message: string, strength: string}
     */
    validatePasswordStrength: (password) => {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        if (password.length < minLength) {
            return {
                isValid: false,
                message: chrome.i18n.getMessage("notif_passwd_too_short") || `Password must be at least ${minLength} characters`,
                strength: "weak"
            };
        }

        let strength = 0;
        if (hasUpperCase) strength++;
        if (hasLowerCase) strength++;
        if (hasNumbers) strength++;
        if (hasSpecialChar) strength++;
        if (password.length >= 12) strength++;

        let strengthLevel = "weak";
        let strengthMessage = "";

        if (strength >= 4) {
            strengthLevel = "strong";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_strong") || "Strong password";
        } else if (strength >= 2) {
            strengthLevel = "medium";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_medium") || "Medium password";
        } else {
            strengthLevel = "weak";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_weak") || "Weak password - use uppercase, lowercase, numbers, and symbols";
        }

        return {
            isValid: true,
            message: strengthMessage,
            strength: strengthLevel
        };
    },

    /**
     * Displays recovery key modal with download and copy options
     * @param {string} recoveryKey - The generated recovery key
     * @returns {void}
     */
    showRecoveryKey: (recoveryKey) => {
        const modal = document.createElement("div");
        modal.className = "recovery-modal";
        modal.innerHTML = `
            <div class="recovery-modal-content">
                <h2>${chrome.i18n.getMessage("recovery_title") || "Save Your Recovery Key"}</h2>
                <p>${chrome.i18n.getMessage("recovery_description") || "Save this recovery key in a safe place. You'll need it to reset your password if you forget it."}</p>
                <div class="recovery-key-display">${recoveryKey}</div>
                <div class="recovery-actions">
                    <button class="button recovery-copy">${chrome.i18n.getMessage("recovery_copy") || "Copy Key"}</button>
                    <button class="button recovery-download">${chrome.i18n.getMessage("recovery_download") || "Download Key"}</button>
                </div>
                <p class="recovery-warning">${chrome.i18n.getMessage("recovery_warning") || "⚠️ This key will only be shown once. Make sure to save it!"}</p>
                <button class="button recovery-close">${chrome.i18n.getMessage("recovery_close") || "I've Saved It"}</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Copy functionality
        modal.querySelector(".recovery-copy").addEventListener("click", () => {
            navigator.clipboard.writeText(recoveryKey);
            const btn = modal.querySelector(".recovery-copy");
            btn.innerText = chrome.i18n.getMessage("recovery_copied") || "✓ Copied!";
            setTimeout(() => {
                btn.innerText = chrome.i18n.getMessage("recovery_copy") || "Copy Key";
            }, 2000);
        });

        // Download functionality
        modal.querySelector(".recovery-download").addEventListener("click", () => {
            const blob = new Blob([`Browser Lock Extension - Recovery Key\n\nYour Recovery Key: ${recoveryKey}\n\nKeep this safe! You'll need it to reset your password.\nDate: ${new Date().toLocaleDateString()}`], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "browser-lock-recovery-key.txt";
            a.click();
            URL.revokeObjectURL(url);
        });

        // Close functionality
        modal.querySelector(".recovery-close").addEventListener("click", async () => {
            modal.remove();
            await chrome.runtime.reload();
            window.close();
        });
    },

    /**
     * Handles user interaction events (click, input, keydown)
     * @param {Event} event - The DOM event to handle
     * @returns {void}
     */
    handleEvent: event => {
        if (event.type === "input") {
            event.target.value = event.target.value.trim();
            
            // Show password strength indicator while typing new password
            if (event.target.id === "passwd-new") {
                const validation = blo.validatePasswordStrength(event.target.value);
                const strengthIndicator = document.querySelector(".password-strength");
                if (strengthIndicator && event.target.value) {
                    strengthIndicator.innerText = validation.message;
                    strengthIndicator.className = `password-strength ${validation.strength}`;
                    strengthIndicator.style.display = "block";
                } else if (strengthIndicator) {
                    strengthIndicator.style.display = "none";
                }
            }
        } else if (
            event.type === "keydown" &&
            ["passwd-last", "passwd-new", "passwd-new-check"].some(id => event.target.id === id) &&
            event.key === "Enter"
        ) {
            blo.passwd();
        }
    },

    /**
     * Validates and saves/changes the master password
     * @returns {Promise<void>}
     */
    passwd: async () => {
        const [domPasswdLast, domPasswdNew, domPasswdCheck] = [
            ".password-input#passwd-last",
            ".password-input#passwd-new",
            ".password-input#passwd-new-check",
        ].map(selector => document.querySelector(selector));
        const [passwdLast, passwdNew, passwdCheck] = [domPasswdLast.value, domPasswdNew.value, domPasswdCheck.value].map(val => val.trim());
        
        // Validate password strength
        const validation = blo.validatePasswordStrength(passwdNew);
        if (!validation.isValid) {
            Toast.error(validation.message);
            return;
        }

        if (passwdNew && passwdNew === passwdCheck) {
            const response = await chrome.runtime.sendMessage({ type: "passwd", data: { passwdNew, passwdLast } });
            
            if (response?.success && response?.recoveryKey) {
                // Password set or changed successfully - show recovery key
                Toast.success(chrome.i18n.getMessage("notif_set_passwd") || "Password saved successfully!");
                blo.showRecoveryKey(response.recoveryKey);
            } else if (response?.success) {
                // Password changed successfully (fallback if no recovery key)
                Toast.success(chrome.i18n.getMessage("notif_set_passwd") || "Password updated successfully!");
                setTimeout(async () => {
                    await chrome.runtime.reload();
                    window.close();
                }, 2000);
            } else {
                // Wrong old password
                Toast.error(chrome.i18n.getMessage("notif_last_wrong_passwd") || "Current password is incorrect");
                domPasswdLast.value = "";
            }
        } else {
            Toast.error(chrome.i18n.getMessage("notif_not_match_passwd") || "Passwords do not match");
        }
    },
};

chrome.runtime.sendMessage({ type: "config" }, response => {
    if (response.success) {
        config = response.data;
        blo.init();
    }
});