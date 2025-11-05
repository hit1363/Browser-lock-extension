/**
 * Browser Lock Extension - Options Page
 * Manages password setup and configuration
 */

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

        // Initialize password visibility toggles using shared Utils module
        Utils.initPasswordToggles();

        // Show/hide toggle button for passwd-last based on visibility
        const passwdLastWrapper = document.querySelector('[data-target="passwd-last"]');
        if (passwdLastWrapper) {
            passwdLastWrapper.style.display = config?.passwd ? "flex" : "none";
        }

        // Add direct event listener to save button
        const saveButton = document.querySelector("#btn-save");
        if (saveButton) {
            saveButton.addEventListener("click", () => {
                blo.passwd();
            });
        }
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

        // Copy functionality using shared Utils
        modal.querySelector(".recovery-copy").addEventListener("click", async () => {
            const success = await Utils.copyToClipboard(recoveryKey);
            if (success) {
                const btn = modal.querySelector(".recovery-copy");
                btn.innerText = chrome.i18n.getMessage("recovery_copied") || "✓ Copied!";
                setTimeout(() => {
                    btn.innerText = chrome.i18n.getMessage("recovery_copy") || "Copy Key";
                }, 2000);
            }
        });

        // Download functionality using shared Utils
        modal.querySelector(".recovery-download").addEventListener("click", () => {
            const content = `Browser Lock Extension - Recovery Key\n\nYour Recovery Key: ${recoveryKey}\n\nKeep this safe! You'll need it to reset your password.\nDate: ${new Date().toLocaleDateString()}`;
            Utils.downloadText(content, "browser-lock-recovery-key.txt");
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
            event.target.value = Utils.sanitizeInput(event.target.value);
            
            // Show password strength indicator while typing new password
            if (event.target.id === "passwd-new") {
                const validation = Utils.validatePasswordStrength(event.target.value);
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
        
        const passwdLast = Utils.sanitizeInput(domPasswdLast.value);
        const passwdNew = Utils.sanitizeInput(domPasswdNew.value);
        const passwdCheck = Utils.sanitizeInput(domPasswdCheck.value);
        
        // Validate password strength using shared Utils
        const validation = Utils.validatePasswordStrength(passwdNew);
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
        
        // Initialize language switcher with UI update callback
        LanguageSwitcher.init(async (getMsg) => {
            // Update placeholders
            ['#passwd-last', '#passwd-new', '#passwd-new-check'].forEach((id, i) => {
                const key = ['title_last_passwd', 'title_new_passwd', 'title_new_check_passwd'][i];
                document.querySelector(id)?.setAttribute('placeholder', getMsg(key));
            });

            // Update text content
            const title = config?.passwd ? getMsg('title_change_passwd') : getMsg('title_set_passwd');
            document.querySelector('.password-title').textContent = title;
            document.querySelector('.button').textContent = getMsg('btn_save');
            document.querySelector('#link-review').textContent = getMsg('link_review');
            document.querySelector('#link-source').textContent = getMsg('link_source');
            document.querySelector('.first-user-notification').innerHTML = getMsg('notif_first');

            // Update aria-labels
            document.querySelectorAll('.toggle-password').forEach(btn => {
                btn.setAttribute('aria-label', getMsg('toggle_show_password'));
            });
        });
    }
});