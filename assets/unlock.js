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

/** @type {string|null} */
let darkmode = localStorage.getItem("darkmode");

/**
 * Enables dark mode theme
 * @returns {void}
 */
const enableDarkMode = () => {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkmode", "active");
};

/**
 * Disables dark mode theme
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

(() => {
    const locker = {
        /** @type {number} */
        failedAttempts: 0,
        /** @type {number} */
        maxAttempts: 5,
        /** @type {number} */
        lockoutDuration: 60000, // 60 seconds
        /** @type {number|null} */
        lockoutEndTime: null,

        /**
         * Initializes the unlock screen UI and event listeners
         * @returns {void}
         */
        init() {
            // Prioritize UI updates for faster display
            this.updateUI();
            
            // Set up event listeners
            const events = ["click", "keydown", "input"];
            events.forEach(event => window.addEventListener(event, this.handleEvent.bind(this)));

            // Initialize features
            this.initPasswordToggle();
            
            // Auto-focus password input immediately
            const passwordInput = document.querySelector(".password-input");
            if (passwordInput) {
                passwordInput.focus();
            }
            
            // Check status and lockout (non-critical, can be async)
            this.checkStatus();
            this.checkLockout();
        },

        /**
         * Initializes password visibility toggle button
         * @returns {void}
         */
        initPasswordToggle() {
            const toggleButton = document.querySelector(".toggle-password");
            if (toggleButton) {
                toggleButton.addEventListener("click", function() {
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
            }
        },

        /**
         * Checks if user is currently locked out and displays countdown
         * @returns {boolean} True if locked out, false otherwise
         */
        checkLockout() {
            if (this.lockoutEndTime && Date.now() < this.lockoutEndTime) {
                const remainingSeconds = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
                Toast.warning(
                    chrome.i18n.getMessage("notif_lockout") || `Too many attempts. Try again in ${remainingSeconds} seconds.`,
                    { autoClose: false, duration: 0 }
                );
                
                // Update countdown with new toasts
                const countdown = setInterval(() => {
                    const remaining = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
                    if (remaining <= 0) {
                        clearInterval(countdown);
                        this.lockoutEndTime = null;
                        this.failedAttempts = 0;
                        // Clear all toasts
                        const toasts = document.querySelectorAll('.toast');
                        toasts.forEach(toast => Toast.close(toast));
                        document.querySelector(".password-input").disabled = false;
                        Toast.success(chrome.i18n.getMessage("notif_lockout_ended") || "You can try again now");
                    } else {
                        // Update existing toast
                        const toastMessage = document.querySelector('.toast-message');
                        if (toastMessage) {
                            toastMessage.innerText = chrome.i18n.getMessage("notif_lockout") || `Too many attempts. Try again in ${remaining} seconds.`;
                        }
                    }
                }, 1000);

                document.querySelector(".password-input").disabled = true;
                return true;
            }
            return false;
        },

        /**
         * Updates UI text with localized messages
         * @returns {void}
         */
        updateUI() {
            document.title = chrome.i18n.getMessage("title_unlock");
            document.querySelector(".unlock-title").innerText = chrome.i18n.getMessage("title_locked");
            document.querySelector(".password-input").placeholder = chrome.i18n.getMessage("notif_enter_passwd");
            
            // Add forgot password link
            const container = document.querySelector(".password-container");
            if (container && !document.querySelector(".forgot-password-link")) {
                const forgotLink = document.createElement("a");
                forgotLink.className = "forgot-password-link";
                forgotLink.href = "#";
                forgotLink.innerText = chrome.i18n.getMessage("forgot_password") || "Forgot Password?";
                forgotLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.showRecoveryForm();
                });
                container.appendChild(forgotLink);
            }
        },

        /**
         * Shows the recovery key reset form
         * @returns {void}
         */
        showRecoveryForm() {
            const existingForm = document.querySelector(".recovery-form");
            if (existingForm) return; // Already showing

            const container = document.querySelector(".password-container");
            const form = document.createElement("div");
            form.className = "recovery-form";
            form.innerHTML = `
                <h3>${chrome.i18n.getMessage("recovery_reset_title") || "Reset Password"}</h3>
                <p>${chrome.i18n.getMessage("recovery_reset_description") || "Enter your recovery key and new password"}</p>
                
                <div class="password-input-wrapper">
                    <input type="text" class="password-input recovery-key-input" placeholder="${chrome.i18n.getMessage("recovery_key_placeholder") || "Recovery Key (XXXXXX-XXXXXX-XXXXXX-XXXXXX)"}" autocomplete="off">
                </div>
                
                <div class="password-input-wrapper">
                    <input type="password" id="recovery-new-password" class="password-input" placeholder="${chrome.i18n.getMessage("title_new_passwd") || "New Password"}" autocomplete="new-password">
                    <button class="toggle-password" data-target="recovery-new-password" aria-label="${chrome.i18n.getMessage("toggle_show_password") || "Show password"}">
                        <span class="eye-icon">👁️</span>
                        <span class="eye-off-icon" style="display: none;">👁️‍🗨️</span>
                    </button>
                </div>
                
                <div class="recovery-actions">
                    <button class="button recovery-submit">${chrome.i18n.getMessage("recovery_submit") || "Reset Password"}</button>
                    <button class="button recovery-cancel">${chrome.i18n.getMessage("recovery_cancel") || "Cancel"}</button>
                </div>
                <div class="recovery-notification"></div>
            `;
            
            container.appendChild(form);

            // Initialize password toggle for new password field
            const toggleBtn = form.querySelector(".toggle-password");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", function() {
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
            }

            // Submit button
            form.querySelector(".recovery-submit").addEventListener("click", () => {
                this.resetPasswordWithKey();
            });

            // Cancel button
            form.querySelector(".recovery-cancel").addEventListener("click", () => {
                form.remove();
            });

            // Focus recovery key input
            form.querySelector(".recovery-key-input").focus();
        },

        /**
         * Resets password using recovery key
         * @returns {Promise<void>}
         */
        async resetPasswordWithKey() {
            const recoveryKeyInput = document.querySelector(".recovery-key-input");
            const newPasswordInput = document.querySelector("#recovery-new-password");
            const notification = document.querySelector(".recovery-notification");

            const recoveryKey = recoveryKeyInput.value.trim().toUpperCase();
            const newPassword = newPasswordInput.value.trim();

            if (!recoveryKey || !newPassword) {
                notification.innerText = chrome.i18n.getMessage("recovery_empty_fields") || "Please fill in all fields";
                notification.style.color = "#e74c3c";
                setTimeout(() => notification.innerText = "", 3000);
                return;
            }

            if (newPassword.length < 6) {
                notification.innerText = chrome.i18n.getMessage("notif_passwd_too_short") || "Password must be at least 6 characters";
                notification.style.color = "#e74c3c";
                setTimeout(() => notification.innerText = "", 3000);
                return;
            }

            try {
                const response = await chrome.runtime.sendMessage({ 
                    type: "recovery", 
                    data: { recoveryKey, newPassword } 
                });

                if (response?.success) {
                    notification.innerText = chrome.i18n.getMessage("recovery_success") || "✓ Password reset! Showing new recovery key...";
                    notification.style.color = "#2ecc71";
                    
                    // Show new recovery key
                    setTimeout(() => {
                        this.showNewRecoveryKey(response.recoveryKey);
                    }, 1500);
                } else {
                    notification.innerText = response?.message || chrome.i18n.getMessage("recovery_failed") || "Invalid recovery key";
                    notification.style.color = "#e74c3c";
                    setTimeout(() => notification.innerText = "", 3000);
                }
            } catch (error) {
                console.error("Recovery failed:", error);
                notification.innerText = chrome.i18n.getMessage("recovery_error") || "Error resetting password";
                notification.style.color = "#e74c3c";
                setTimeout(() => notification.innerText = "", 3000);
            }
        },

        /**
         * Shows the new recovery key after successful reset
         * @param {string} recoveryKey - The new recovery key
         * @returns {void}
         */
        showNewRecoveryKey(recoveryKey) {
            const form = document.querySelector(".recovery-form");
            form.innerHTML = `
                <h3>${chrome.i18n.getMessage("recovery_new_key_title") || "Save Your New Recovery Key"}</h3>
                <p>${chrome.i18n.getMessage("recovery_new_key_description") || "Your password has been reset. Save this new recovery key!"}</p>
                <div class="recovery-key-display">${recoveryKey}</div>
                <div class="recovery-actions">
                    <button class="button recovery-copy">${chrome.i18n.getMessage("recovery_copy") || "Copy Key"}</button>
                    <button class="button recovery-done">${chrome.i18n.getMessage("recovery_done") || "Done"}</button>
                </div>
            `;

            // Copy functionality
            form.querySelector(".recovery-copy").addEventListener("click", () => {
                navigator.clipboard.writeText(recoveryKey);
                const btn = form.querySelector(".recovery-copy");
                btn.innerText = chrome.i18n.getMessage("recovery_copied") || "✓ Copied!";
                setTimeout(() => {
                    btn.innerText = chrome.i18n.getMessage("recovery_copy") || "Copy Key";
                }, 2000);
            });

            // Done button
            form.querySelector(".recovery-done").addEventListener("click", () => {
                window.location.reload();
            });
        },

        /**
         * Attempts to unlock the browser with the entered password
         * @param {boolean} [withNotif=true] - Whether to show notification on failure
         * @returns {Promise<void>}
         */
        async unlock(withNotif = true) {
            // Check if locked out
            if (this.checkLockout()) {
                return;
            }

            const domPasswd = document.querySelector(".password-input");
            const passwd = domPasswd.value.trim();

            try {
                const response = await chrome.runtime.sendMessage({ type: "unlock", data: { passwd } });
                if (response?.success) {
                    this.failedAttempts = 0;
                    Toast.success(chrome.i18n.getMessage("notif_unlock_success") || "✓ Unlocked successfully!", { duration: 1000 });
                    setTimeout(() => window.close(), 500);
                    return;
                }

                if (withNotif) {
                    this.failedAttempts++;
                    
                    const attemptsRemaining = this.maxAttempts - this.failedAttempts;
                    
                    if (this.failedAttempts >= this.maxAttempts) {
                        // Trigger lockout
                        this.lockoutEndTime = Date.now() + this.lockoutDuration;
                        this.checkLockout();
                    } else {
                        const message = chrome.i18n.getMessage("notif_wrong_passwd_attempts") || 
                            `Incorrect password! ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`;
                        Toast.error(message);
                    }
                    
                    domPasswd.value = ""; // Clear the password field
                }
            } catch (error) {
                console.error("Unlock failed:", error);
                Toast.error(chrome.i18n.getMessage("notif_unlock_error") || "Error unlocking browser");
            }
        },

        /**
         * Displays a notification message
         * @param {HTMLElement} element - The element to display the message in
         * @param {string} message - The message text to display
         * @param {boolean} [persistent=false] - Whether to keep the message visible
         * @returns {void}
         */
        displayNotification(element, message, persistent = false) {
            element.innerText = message;
            if (!persistent) {
                setTimeout(() => (element.innerText = ""), 3000); // Clear notification after 3 seconds
            }
        },

        /**
         * Checks the lock status from background service worker
         * @returns {Promise<void>}
         */
        async checkStatus() {
            try {
                const response = await chrome.runtime.sendMessage({ type: "status" });
                if (!response?.data?.LOCKED) {
                    await chrome.windows.create();
                    window.close();
                }
            } catch (error) {
                console.error("Status check failed:", error);
            }
        },

        /**
         * Handles user interaction events (click, keydown, input)
         * @param {Event} event - The DOM event to handle
         * @returns {void}
         */
        handleEvent(event) {
            const targetClass = event.target.className;
            if (event.type === "keydown" && targetClass.includes("password-input") && event.key === "Enter") {
                this.unlock();
            } else if (event.type === "input" && targetClass.includes("password-input")) {
                this.unlock(false);
            }
        }
    };

    locker.init();
})();