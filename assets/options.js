let darkmode = localStorage.getItem("darkmode");
const themeToggle = document.querySelector(".theme-toggle");

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

themeToggle.addEventListener("click", () => {
    darkmode = localStorage.getItem("darkmode");
    darkmode !== "active" ? enableDarkMode() : disableDarkMode();
});

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
                "#link-review": { href: `` },
                "#link-source": { href: "https://github.com/zimocode/blocker" },
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
    },

    handleEvent: event => {
        if (event.type === "click" && event.target.classList.contains("button")) {
            blo.passwd();
        } else if (event.type === "input") {
            event.target.value = event.target.value.trim();
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