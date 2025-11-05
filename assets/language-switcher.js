/**
 * Lightweight Language Switcher Module
 * Provides dynamic language switching for the extension
 * @module LanguageSwitcher
 */

const LanguageSwitcher = (() => {
    const languageMap = {
        'en': 'English',
        'bn': 'বাংলা',
        'ar': 'العربية',
        'de': 'Deutsch',
        'es': 'Español',
        'fr': 'Français',
        'hi': 'हिन्दी',
        'ja': '日本語',
        'ru': 'Русский',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文'
    };

    let currentLang = localStorage.getItem('selectedLanguage') || chrome.i18n.getUILanguage().toLowerCase();
    const messagesCache = new Map();

    /**
     * Loads messages from locale file with caching
     * @param {string} locale - Locale code
     * @returns {Promise<Object>} Messages object
     */
    async function loadMessages(locale) {
        // Check cache first
        if (messagesCache.has(locale)) {
            return messagesCache.get(locale);
        }

        try {
            const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
            if (!response.ok) throw new Error(`Failed to load locale: ${locale}`);
            
            const messages = await response.json();
            messagesCache.set(locale, messages);
            return messages;
        } catch (error) {
            console.warn(`Failed to load locale ${locale}, falling back to English`);
            // Fallback to English if not already trying English
            if (locale !== 'en') {
                return loadMessages('en');
            }
            return {};
        }
    }

    /**
     * Updates UI with selected language
     * @param {Function} updateCallback - Custom update function
     * @returns {Promise<void>}
     */
    async function updateUI(updateCallback) {
        if (!updateCallback) return;
        
        const messages = await loadMessages(currentLang);
        const getMsg = (key) => messages[key]?.message || key;
        updateCallback(getMsg);
    }

    /**
     * Normalizes language code to supported locale
     * @param {string} lang - Language code to normalize
     * @returns {string} Normalized language code
     */
    function normalizeLang(lang) {
        if (languageMap[lang]) return lang;
        
        const baseLang = lang.split('-')[0];
        return languageMap[baseLang] ? baseLang : 'en';
    }

    return {
        /**
         * Initializes language switcher
         * @param {Function} [updateCallback] - Custom UI update function
         * @returns {Promise<void>}
         */
        async init(updateCallback) {
            const toggle = document.querySelector('.language-toggle');
            const dropdown = document.querySelector('.language-dropdown');
            const options = document.querySelectorAll('.language-option');
            const label = document.querySelector('.language-label');

            // Early return if required elements not found
            if (!toggle || !dropdown || !label) return;

            // Normalize and set current language
            currentLang = normalizeLang(currentLang);
            label.textContent = languageMap[currentLang];

            // Mark active language
            options.forEach(option => {
                option.classList.toggle('active', option.dataset.lang === currentLang);
            });

            // Close dropdown helper
            const closeDropdown = () => {
                toggle.setAttribute('aria-expanded', 'false');
                dropdown.classList.remove('show');
            };

            // Toggle dropdown
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', !isExpanded);
                dropdown.classList.toggle('show');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target) && e.target !== toggle) {
                    closeDropdown();
                }
            });

            // Language selection
            options.forEach(option => {
                option.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const selectedLang = option.dataset.lang;
                    
                    if (selectedLang !== currentLang) {
                        // Update UI state
                        options.forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                        
                        // Save preference and update
                        localStorage.setItem('selectedLanguage', selectedLang);
                        currentLang = selectedLang;
                        label.textContent = languageMap[selectedLang];
                        
                        closeDropdown();
                        
                        // Update UI with new language
                        await updateUI(updateCallback);
                    }
                });
            });

            // Keyboard navigation
            dropdown.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeDropdown();
                    toggle.focus();
                }
            });

            // Load messages if not using browser default language
            if (currentLang !== chrome.i18n.getUILanguage().toLowerCase()) {
                await updateUI(updateCallback);
            }
        },

        /**
         * Gets current selected language
         * @returns {string} Current language code
         */
        getCurrentLanguage: () => currentLang,
        
        /**
         * Updates UI with current language
         * @param {Function} callback - Update callback function
         * @returns {Promise<void>}
         */
        updateUI: (callback) => updateUI(callback),
        
        /**
         * Gets message for a key in current language
         * @param {string} key - Message key
         * @returns {Promise<string>} Translated message
         */
        getMessage: async (key) => {
            const messages = await loadMessages(currentLang);
            return messages[key]?.message || key;
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageSwitcher;
}
