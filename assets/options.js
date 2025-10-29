let darkmode = localStorage.getItem("darkmode");

const enableDarkMode = () => {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkmode", "active");
};

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

let config;

const blo = {
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

    handleEvent: event => {
        if (event.type === "click" && event.target.classList.contains("button")) {
            blo.passwd();
        } else if (event.type === "input") {
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

    passwd: async () => {
        const [domPasswdLast, domPasswdNew, domPasswdCheck] = [
            ".password-input#passwd-last",
            ".password-input#passwd-new",
            ".password-input#passwd-new-check",
        ].map(selector => document.querySelector(selector));
        const [passwdLast, passwdNew, passwdCheck] = [domPasswdLast.value, domPasswdNew.value, domPasswdCheck.value].map(val => val.trim());

        const domNotif = document.querySelector(".notification");
        
        // Validate password strength
        const validation = blo.validatePasswordStrength(passwdNew);
        if (!validation.isValid) {
            domNotif.innerText = validation.message;
            setTimeout(() => (domNotif.innerText = ""), 3000);
            return;
        }

        if (passwdNew && passwdNew === passwdCheck) {
            const response = await chrome.runtime.sendMessage({ type: "passwd", data: { passwdNew, passwdLast } });
            domNotif.innerText = response?.success
                ? chrome.i18n.getMessage("notif_set_passwd")
                : chrome.i18n.getMessage("notif_last_wrong_passwd");
            if (response?.success) {
                setTimeout(async () => {
                    domNotif.innerText = "";
                    await chrome.runtime.reload();
                    window.close();
                }, 3000);
            } else {
                domPasswdLast.value = "";
                setTimeout(() => (domNotif.innerText = ""), 3000);
            }
        } else {
            domNotif.innerText = chrome.i18n.getMessage("notif_not_match_passwd");
            setTimeout(() => (domNotif.innerText = ""), 3000);
        }
    },
};

chrome.runtime.sendMessage({ type: "config" }, response => {
    if (response.success) {
        config = response.data;
        blo.init();
    }
});