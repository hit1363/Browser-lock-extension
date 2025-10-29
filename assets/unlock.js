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

(() => {
    const locker = {
        failedAttempts: 0,
        maxAttempts: 5,
        lockoutDuration: 60000, // 60 seconds
        lockoutEndTime: null,

        init() {
            const events = ["click", "keydown", "input"];
            events.forEach(event => window.addEventListener(event, this.handleEvent.bind(this)));

            this.updateUI();
            this.checkStatus();
            this.checkLockout();
            this.initPasswordToggle();
        },

        /**
         * Initialize password visibility toggle button
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
         * Check if user is currently locked out
         * @returns {boolean} True if locked out
         */
        checkLockout() {
            if (this.lockoutEndTime && Date.now() < this.lockoutEndTime) {
                const remainingSeconds = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
                this.displayNotification(
                    document.querySelector(".notification"),
                    chrome.i18n.getMessage("notif_lockout") || `Too many attempts. Try again in ${remainingSeconds} seconds.`,
                    true
                );
                
                // Update countdown
                const countdown = setInterval(() => {
                    const remaining = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
                    if (remaining <= 0) {
                        clearInterval(countdown);
                        this.lockoutEndTime = null;
                        this.failedAttempts = 0;
                        document.querySelector(".notification").innerText = "";
                        document.querySelector(".password-input").disabled = false;
                        document.querySelector(".button").disabled = false;
                    } else {
                        document.querySelector(".notification").innerText = 
                            chrome.i18n.getMessage("notif_lockout") || `Too many attempts. Try again in ${remaining} seconds.`;
                    }
                }, 1000);

                document.querySelector(".password-input").disabled = true;
                document.querySelector(".button").disabled = true;
                return true;
            }
            return false;
        },

        updateUI() {
            document.title = chrome.i18n.getMessage("title_unlock");
            document.querySelector(".unlock-title").innerText = chrome.i18n.getMessage("title_locked");
            document.querySelector(".button").innerText = chrome.i18n.getMessage("btn_unlock");
            document.querySelector(".password-input").placeholder = chrome.i18n.getMessage("notif_enter_passwd");
        },

        async unlock(withNotif = true) {
            // Check if locked out
            if (this.checkLockout()) {
                return;
            }

            const domNotif = document.querySelector(".notification");
            const domPasswd = document.querySelector(".password-input");

            domNotif.innerText = ""; // Clear the notification text
            const passwd = domPasswd.value.trim();

            try {
                const response = await chrome.runtime.sendMessage({ type: "unlock", data: { passwd } });
                if (response?.success) {
                    this.failedAttempts = 0;
                    return window.close();
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
                        this.displayNotification(domNotif, message);
                    }
                    
                    domPasswd.value = ""; // Clear the password field
                }
            } catch (error) {
                console.error("Unlock failed:", error);
            }
        },

        displayNotification(element, message, persistent = false) {
            element.innerText = message;
            if (!persistent) {
                setTimeout(() => (element.innerText = ""), 3000); // Clear notification after 3 seconds
            }
        },

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

        handleEvent(event) {
            const targetClass = event.target.className;
            if (event.type === "click" && targetClass.includes("button")) {
                this.unlock();
            } else if (event.type === "keydown" && targetClass.includes("password-input") && event.key === "Enter") {
                this.unlock();
            } else if (event.type === "input" && targetClass.includes("password-input")) {
                this.unlock(false);
            }
        }
    };

    locker.init();
})();