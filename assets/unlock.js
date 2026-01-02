/**
 * Browser Lock Extension - Unlock Page (Lightweight)
 * Optimized for performance and reduced memory footprint
 */

// Lightweight Language Switcher
const LanguageSwitcher = (() => {
    const languages = {'en':'English','bn':'বাংলা','ar':'العربية','de':'Deutsch','es':'Español','fr':'Français','hi':'हिन्दी','ja':'日本語','ru':'Русский','zh-CN':'简体中文','zh-TW':'繁體中文'};
    let lang = localStorage.getItem('selectedLanguage') || chrome.i18n.getUILanguage().toLowerCase().split('-')[0];
    let cache = {};

    const loadMessages = async (locale) => {
        if (cache[locale]) return cache[locale];
        try {
            const res = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
            cache[locale] = await res.json();
            return cache[locale];
        } catch {
            return locale !== 'en' ? loadMessages('en') : {};
        }
    };

    const updateUI = async () => {
        const msgs = await loadMessages(lang);
        const getMsg = k => msgs[k]?.message || k;
        const title = document.querySelector('.unlock-title');
        if (title) title.textContent = getMsg('title_unlock');
        const input = document.querySelector('#unlock-passwd');
        if (input) input.placeholder = getMsg('title_unlock');
        document.querySelectorAll('.toggle-password').forEach(b => b.setAttribute('aria-label', getMsg('toggle_show_password')));
    };

    return {
        init: async () => {
            const [toggle, dropdown, label] = ['.language-toggle', '.language-dropdown', '.language-label'].map(s => document.querySelector(s));
            if (!toggle || !dropdown || !label) return;

            lang = languages[lang] ? lang : 'en';
            label.textContent = languages[lang];

            toggle.onclick = e => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            };

            document.onclick = e => {
                if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove('show');
            };

            document.querySelectorAll('.language-option').forEach(opt => {
                if (opt.dataset.lang === lang) opt.classList.add('active');
                opt.onclick = async e => {
                    e.stopPropagation();
                    const newLang = opt.dataset.lang;
                    if (newLang !== lang) {
                        document.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
                        opt.classList.add('active');
                        localStorage.setItem('selectedLanguage', newLang);
                        lang = newLang;
                        label.textContent = languages[newLang];
                        dropdown.classList.remove('show');
                        await updateUI();
                    }
                };
            });

            if (lang !== chrome.i18n.getUILanguage().toLowerCase().split('-')[0]) await updateUI();
        }
    };
})();

LanguageSwitcher.init();

// Main unlock functionality (optimized)
(() => {
    const locker = {
        failedAttempts: 0,
        maxAttempts: 5,
        lockoutDuration: 60000,
        lockoutEndTime: null,

        init() {
            this.updateUI();
            
            const input = document.querySelector(".password-input");
            if (input) {
                input.focus();
                input.addEventListener("keydown", e => e.key === "Enter" && this.unlock());
                input.addEventListener("input", () => this.unlock(false));
            }

            this.initPasswordToggle();
            this.checkStatus();
            this.checkLockout();
        },

        initPasswordToggle() {
            document.querySelector(".toggle-password")?.addEventListener("click", function() {
                const input = document.getElementById(this.getAttribute("data-target"));
                const [eye, eyeOff] = [this.querySelector(".eye-icon"), this.querySelector(".eye-off-icon")];
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                eye.style.display = isPassword ? "none" : "block";
                eyeOff.style.display = isPassword ? "block" : "none";
                this.setAttribute("aria-label", chrome.i18n.getMessage(isPassword ? "toggle_hide_password" : "toggle_show_password"));
            });
        },

        checkLockout() {
            if (this.lockoutEndTime && Date.now() < this.lockoutEndTime) {
                const input = document.querySelector(".password-input");
                input.disabled = true;
                
                const countdown = setInterval(() => {
                    const remaining = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
                    if (remaining <= 0) {
                        clearInterval(countdown);
                        this.lockoutEndTime = null;
                        this.failedAttempts = 0;
                        input.disabled = false;
                        Toast.success(chrome.i18n.getMessage("notif_lockout_ended") || "You can try again now");
                    } else {
                        const msg = document.querySelector('.toast-message');
                        if (msg) msg.innerText = `Too many attempts. Try again in ${remaining} seconds.`;
                    }
                }, 1000);
                
                Toast.warning(`Too many attempts. Try again in ${Math.ceil((this.lockoutEndTime - Date.now()) / 1000)} seconds.`, {autoClose: false});
                return true;
            }
            return false;
        },

        updateUI() {
            document.title = chrome.i18n.getMessage("title_unlock");
            const title = document.querySelector(".unlock-title");
            const input = document.querySelector(".password-input");
            if (title) title.innerText = chrome.i18n.getMessage("title_locked");
            if (input) input.placeholder = chrome.i18n.getMessage("notif_enter_passwd");
            
            const container = document.querySelector(".password-container");
            if (container && !document.querySelector(".forgot-password-link")) {
                const link = document.createElement("a");
                link.className = "forgot-password-link";
                link.href = "#";
                link.innerText = chrome.i18n.getMessage("forgot_password") || "Forgot Password?";
                link.onclick = e => { e.preventDefault(); this.showRecoveryForm(); };
                container.appendChild(link);
            }
        },

        showRecoveryForm() {
            if (document.querySelector(".recovery-form")) return;

            const form = document.createElement("div");
            form.className = "recovery-form";
            form.innerHTML = `
                <h3>${chrome.i18n.getMessage("recovery_reset_title") || "Reset Password"}</h3>
                <p>${chrome.i18n.getMessage("recovery_reset_description") || "Enter your recovery key and new password"}</p>
                <div class="password-input-wrapper">
                    <input type="text" class="password-input recovery-key-input" placeholder="Recovery Key" autocomplete="off">
                </div>
                <div class="password-input-wrapper">
                    <input type="password" id="recovery-new-password" class="password-input" placeholder="New Password" autocomplete="new-password">
                    <button class="toggle-password" data-target="recovery-new-password" aria-label="Show password">
                        <span class="eye-icon">👁️</span>
                        <span class="eye-off-icon" style="display:none">👁️‍🗨️</span>
                    </button>
                </div>
                <div class="recovery-actions">
                    <button class="button recovery-submit">${chrome.i18n.getMessage("recovery_submit") || "Reset"}</button>
                    <button class="button recovery-cancel">${chrome.i18n.getMessage("recovery_cancel") || "Cancel"}</button>
                </div>
                <div class="recovery-notification"></div>
            `;
            
            document.querySelector(".password-container").appendChild(form);

            form.querySelector(".toggle-password")?.addEventListener("click", function() {
                const input = document.getElementById(this.getAttribute("data-target"));
                const [eye, eyeOff] = [this.querySelector(".eye-icon"), this.querySelector(".eye-off-icon")];
                const isPwd = input.type === "password";
                input.type = isPwd ? "text" : "password";
                eye.style.display = isPwd ? "none" : "block";
                eyeOff.style.display = isPwd ? "block" : "none";
            });

            form.querySelector(".recovery-submit").onclick = () => this.resetPasswordWithKey();
            form.querySelector(".recovery-cancel").onclick = () => form.remove();
            form.querySelector(".recovery-key-input").focus();
        },

        async resetPasswordWithKey() {
            const keyInput = document.querySelector(".recovery-key-input");
            const pwdInput = document.querySelector("#recovery-new-password");
            const notif = document.querySelector(".recovery-notification");

            const key = keyInput.value.trim().toUpperCase();
            const pwd = pwdInput.value.trim();

            const showNotif = (msg, color) => {
                notif.innerText = msg;
                notif.style.color = color;
                setTimeout(() => notif.innerText = "", 3000);
            };

            if (!key || !pwd) return showNotif("Please fill in all fields", "#e74c3c");
            if (pwd.length < 6) return showNotif("Password must be at least 6 characters", "#e74c3c");

            try {
                const res = await Utils.sendMessage({type: "recovery", data: {recoveryKey: key, newPassword: pwd}});
                if (res?.success) {
                    notif.style.color = "#2ecc71";
                    notif.innerText = "✓ Password reset!";
                    setTimeout(() => this.showNewRecoveryKey(res.recoveryKey), 1500);
                } else {
                    showNotif(res?.message || "Invalid recovery key", "#e74c3c");
                }
            } catch {
                showNotif("Error resetting password", "#e74c3c");
            }
        },

        showNewRecoveryKey(key) {
            const form = document.querySelector(".recovery-form");
            form.innerHTML = `
                <h3>Save Your New Recovery Key</h3>
                <p>Your password has been reset. Save this new recovery key!</p>
                <div class="recovery-key-display">${key}</div>
                <div class="recovery-actions">
                    <button class="button recovery-copy">Copy Key</button>
                    <button class="button recovery-done">Done</button>
                </div>
            `;

            form.querySelector(".recovery-copy").onclick = () => {
                navigator.clipboard.writeText(key);
                const btn = form.querySelector(".recovery-copy");
                btn.innerText = "✓ Copied!";
                setTimeout(() => btn.innerText = "Copy Key", 2000);
            };

            form.querySelector(".recovery-done").onclick = () => window.location.reload();
        },

        async unlock(withNotif = true) {
            if (this.checkLockout()) return;

            const input = document.querySelector(".password-input");
            const pwd = input.value.trim();

            try {
                const res = await Utils.sendMessage({type: "unlock", data: {passwd: pwd}});
                if (res?.success) {
                    this.failedAttempts = 0;
                    Toast.success("✓ Unlocked!", {duration: 1000});
                    setTimeout(() => window.close(), 500);
                    return;
                }

                if (withNotif) {
                    this.failedAttempts++;
                    const remaining = this.maxAttempts - this.failedAttempts;
                    
                    if (this.failedAttempts >= this.maxAttempts) {
                        this.lockoutEndTime = Date.now() + this.lockoutDuration;
                        this.checkLockout();
                    } else {
                        Toast.error(`Incorrect password! ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
                    }
                    input.value = "";
                }
            } catch {
                Toast.error("Error unlocking browser");
            }
        },

        async checkStatus() {
            try {
                const res = await Utils.sendMessage({type: "status"});
                if (!res?.data?.LOCKED) {
                    await chrome.windows.create();
                    window.close();
                }
            } catch {}
        }
    };

    locker.init();
})();
