/**
 * Lightweight Toast Notification System
 * Similar to React-Toastify but for vanilla JavaScript
 */

const Toast = {
    container: null,

    /**
     * Initializes the toast container
     * @returns {void}
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     * @param {Object} options - Toast options
     * @returns {void}
     */
    show(message, options = {}) {
        this.init();

        const {
            type = 'default', // 'success', 'error', 'warning', 'info', 'default'
            duration = 3000,
            position = 'top-right',
            autoClose = true
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-${position}`;
        
        // Add icon based on type
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.close(toast));

        // Auto close
        if (autoClose && duration > 0) {
            setTimeout(() => this.close(toast), duration);
        }
    },

    /**
     * Closes a toast notification
     * @param {HTMLElement} toast - The toast element to close
     * @returns {void}
     */
    close(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Gets icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon HTML
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            default: '●'
        };
        return icons[type] || icons.default;
    },

    /**
     * Shows a success toast
     * @param {string} message - The message to display
     * @param {Object} options - Additional options
     * @returns {void}
     */
    success(message, options = {}) {
        this.show(message, { ...options, type: 'success' });
    },

    /**
     * Shows an error toast
     * @param {string} message - The message to display
     * @param {Object} options - Additional options
     * @returns {void}
     */
    error(message, options = {}) {
        this.show(message, { ...options, type: 'error' });
    },

    /**
     * Shows a warning toast
     * @param {string} message - The message to display
     * @param {Object} options - Additional options
     * @returns {void}
     */
    warning(message, options = {}) {
        this.show(message, { ...options, type: 'warning' });
    },

    /**
     * Shows an info toast
     * @param {string} message - The message to display
     * @param {Object} options - Additional options
     * @returns {void}
     */
    info(message, options = {}) {
        this.show(message, { ...options, type: 'info' });
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
}
