/**
 * Theme Manager Module
 * Handles dark mode toggling and persistence
 * @module Theme
 */

const Theme = (() => {
    const STORAGE_KEY = 'darkmode';
    const DARK_MODE_CLASS = 'dark-mode';
    const ACTIVE_VALUE = 'active';

    /**
     * Enables dark mode
     */
    const enableDarkMode = () => {
        document.body.classList.add(DARK_MODE_CLASS);
        localStorage.setItem(STORAGE_KEY, ACTIVE_VALUE);
    };

    /**
     * Disables dark mode
     */
    const disableDarkMode = () => {
        document.body.classList.remove(DARK_MODE_CLASS);
        localStorage.setItem(STORAGE_KEY, null);
    };

    /**
     * Toggles dark mode
     */
    const toggle = () => {
        const isDark = localStorage.getItem(STORAGE_KEY) === ACTIVE_VALUE;
        isDark ? disableDarkMode() : enableDarkMode();
    };

    /**
     * Checks if dark mode is currently active
     * @returns {boolean}
     */
    const isDarkMode = () => {
        return localStorage.getItem(STORAGE_KEY) === ACTIVE_VALUE;
    };

    /**
     * Initializes theme based on stored preference
     */
    const init = () => {
        if (isDarkMode()) {
            enableDarkMode();
        }

        // Set up toggle button if it exists
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggle);
        }
    };

    return {
        init,
        enableDarkMode,
        disableDarkMode,
        toggle,
        isDarkMode
    };
})();

// Auto-initialize theme
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Theme.init);
} else {
    Theme.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Theme;
}
