/**
 * Utility Functions Module
 * Common helper functions used across the extension
 * @module Utils
 */

const Utils = (() => {
    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} - {isValid: boolean, message: string, strength: string}
     */
    const validatePasswordStrength = (password) => {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        if (password.length < minLength) {
            return {
                isValid: false,
                message: chrome.i18n.getMessage("notif_passwd_too_short") || 
                        `Password must be at least ${minLength} characters`,
                strength: "weak"
            };
        }

        let strength = 0;
        if (hasUpperCase) strength++;
        if (hasLowerCase) strength++;
        if (hasNumbers) strength++;
        if (hasSpecialChar) strength++;
        if (password.length >= 12) strength++;

        let strengthLevel, strengthMessage;

        if (strength >= 4) {
            strengthLevel = "strong";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_strong") || "Strong password";
        } else if (strength >= 2) {
            strengthLevel = "medium";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_medium") || "Medium password";
        } else {
            strengthLevel = "weak";
            strengthMessage = chrome.i18n.getMessage("notif_passwd_weak") || 
                            "Weak password - use uppercase, lowercase, numbers, and symbols";
        }

        return {
            isValid: true,
            message: strengthMessage,
            strength: strengthLevel
        };
    };

    /**
     * Sanitizes user input by trimming whitespace
     * @param {string} input - Input string to sanitize
     * @returns {string} - Sanitized string
     */
    const sanitizeInput = (input) => {
        return typeof input === 'string' ? input.trim() : '';
    };

    /**
     * Initializes password visibility toggle buttons
     * @param {string} [selector='.toggle-password'] - CSS selector for toggle buttons
     */
    const initPasswordToggles = (selector = '.toggle-password') => {
        const toggleButtons = document.querySelectorAll(selector);
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (!targetInput) return;

                const eyeIcon = this.querySelector('.eye-icon');
                const eyeOffIcon = this.querySelector('.eye-off-icon');
                const isPassword = targetInput.type === 'password';

                targetInput.type = isPassword ? 'text' : 'password';
                if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
                if (eyeOffIcon) eyeOffIcon.style.display = isPassword ? 'block' : 'none';
                
                const labelKey = isPassword ? 'toggle_hide_password' : 'toggle_show_password';
                const labelDefault = isPassword ? 'Hide password' : 'Show password';
                this.setAttribute('aria-label', chrome.i18n.getMessage(labelKey) || labelDefault);
            });
        });
    };

    /**
     * Debounces a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Creates a download link for text content
     * @param {string} content - Content to download
     * @param {string} filename - Name of the file
     * @param {string} [mimeType='text/plain'] - MIME type of the file
     */
    const downloadText = (content, filename, mimeType = 'text/plain') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    /**
     * Safely copies text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    };

    /**
     * Sends a runtime message with robust MV3 error handling.
     * Resolves to the response object, or undefined if the message could not be delivered.
     * @param {any} message - Message payload
     * @returns {Promise<any|undefined>}
     */
    const sendMessage = (message) => {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    const lastError = chrome.runtime.lastError;
                    if (lastError) {
                        console.error('chrome.runtime.sendMessage failed:', lastError);
                        resolve(undefined);
                        return;
                    }
                    resolve(response);
                });
            } catch (error) {
                console.error('chrome.runtime.sendMessage threw:', error);
                resolve(undefined);
            }
        });
    };

    return {
        validatePasswordStrength,
        sanitizeInput,
        initPasswordToggles,
        debounce,
        downloadText,
        copyToClipboard,
        sendMessage
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
