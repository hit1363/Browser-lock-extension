/**
 * Applies persisted theme as early as possible.
 * MV3 CSP blocks inline scripts, so this must be external.
 */

(() => {
    try {
        if (localStorage.getItem('darkmode') === 'active') {
            document.documentElement.classList.add('dark-mode');
        }
    } catch {
        // Ignore (e.g., storage unavailable)
    }
})();
