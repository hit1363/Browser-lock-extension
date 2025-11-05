/**
 * Lightweight Toast Notification System
 * Provides toast notifications with customizable types and durations
 * @module Toast
 */

const Toast = (() => {
    let container = null;
    const icons = { 
        success: '✓', 
        error: '✕', 
        warning: '⚠', 
        info: 'ℹ', 
        default: '●' 
    };

    /**
     * Initializes the toast container
     * @private
     */
    const init = () => {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    };

    /**
     * Closes a toast notification
     * @param {HTMLElement} toast - The toast element to close
     */
    const close = (toast) => {
        if (!toast || !toast.parentNode) return;
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.parentNode?.removeChild(toast), 300);
    };

    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.type='default'] - Toast type (success, error, warning, info, default)
     * @param {number} [options.duration=3000] - Duration in milliseconds (0 = no auto-close)
     * @param {boolean} [options.autoClose=true] - Whether to auto-close the toast
     */
    const show = (message, { type = 'default', duration = 3000, autoClose = true } = {}) => {
        init();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-top-right`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.default}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Close">×</button>
        `;
        container.appendChild(toast);
        
        // Show toast with slight delay for animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast-show'));
        });
        
        toast.querySelector('.toast-close').addEventListener('click', () => close(toast));
        if (autoClose && duration > 0) {
            setTimeout(() => close(toast), duration);
        }
    };

    return {
        show,
        close,
        success: (msg, opt) => show(msg, { ...opt, type: 'success' }),
        error: (msg, opt) => show(msg, { ...opt, type: 'error' }),
        warning: (msg, opt) => show(msg, { ...opt, type: 'warning' }),
        info: (msg, opt) => show(msg, { ...opt, type: 'info' })
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
}
