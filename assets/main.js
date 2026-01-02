/** @constant {number} Number of iterations for PBKDF2 key derivation */
const ITERATION_TIMES = 102400;

/** @constant {number} Length of the salt in bytes */
const SALT_LENGTH = 64;

/**
 * Converts an ArrayBuffer to a hexadecimal string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} Hexadecimal string representation
 */
const arrayBufferToHex = (buffer) => {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Converts a hexadecimal string to an ArrayBuffer
 * @param {string} hex - The hexadecimal string to convert
 * @returns {ArrayBuffer} The converted ArrayBuffer
 */
const hexToArrayBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
};

/**
 * Derives a cryptographic key from a password using PBKDF2
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - The salt for key derivation
 * @param {number} ITERATIONS - Number of iterations for PBKDF2
 * @returns {Promise<CryptoKey>} The derived cryptographic key
 */
const deriveKey = async (password, salt, ITERATIONS) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial, { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * Encrypts data using AES-GCM encryption
 * @param {CryptoKey} key - The encryption key
 * @param {string} data - The data to encrypt
 * @returns {Promise<Uint8Array>} The encrypted data with IV prepended
 */
const encryptData = async (key, data) => {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        enc.encode(data)
    );

    return new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
};

/**
 * Decrypts data using AES-GCM decryption
 * @param {CryptoKey} key - The decryption key
 * @param {Uint8Array} encryptedData - The encrypted data with IV prepended
 * @returns {Promise<string>} The decrypted data as a string
 */
const decryptData = async (key, encryptedData) => {
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    const decrypted = await crypto.subtle.decrypt({
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
};

/**
 * Encrypts content and returns encrypted data with salt
 * @param {string} content - The content to encrypt
 * @returns {Promise<Object|boolean>} Object with encrypted data and salt, or false if content is empty
 */
const encrypt = async (content) => {
    if (!content) {
        return false;
    }
    let password = content;

    let salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    const key = await deriveKey(password, salt, ITERATION_TIMES);
    const encryptedData = await encryptData(key, content);
    const encryptedObject = {
        data: arrayBufferToHex(encryptedData),
        salt: arrayBufferToHex(salt)
    }

    return encryptedObject;
};

/**
 * Decrypts content using password and salt
 * @param {string} encryptedContent - The encrypted content in hex format
 * @param {string} password - The password to decrypt with
 * @param {string} SALT - The salt in hex format
 * @returns {Promise<boolean>} True if decryption succeeds, false otherwise
 */
const decrypt = async (encryptedContent, password, SALT) => {
    const dataHex = encryptedContent;
    const saltHex = SALT;

    if (!saltHex || !dataHex) {
        return false;
    }
    if (saltHex.length % 2 !== 0) {
        return false;
    }

    const salt = hexToArrayBuffer(saltHex);
    const content = hexToArrayBuffer(dataHex);
    const key = await deriveKey(password, salt, ITERATION_TIMES);

    try {
        await decryptData(key, content);
        return true;
    } catch (e) {
        return false;
    }
};

/** @type {Object} Encryption and decryption utility object */
const pbkdf2 = { encrypt, decrypt };

/**
 * Generates a secure random recovery key
 * @returns {string} A 24-character recovery key (groups of 6 characters separated by dashes)
 */
const generateRecoveryKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    
    let key = '';
    for (let i = 0; i < 24; i++) {
        key += chars[array[i] % chars.length];
        if ((i + 1) % 6 === 0 && i < 23) {
            key += '-';
        }
    }
    return key;
};

/**
 * Hashes a recovery key for secure storage
 * @param {string} recoveryKey - The recovery key to hash
 * @returns {Promise<string>} The hashed recovery key in hex format
 */
const hashRecoveryKey = async (recoveryKey) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(recoveryKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hash);
};

/**
 * Verifies a recovery key against stored hash
 * @param {string} recoveryKey - The recovery key to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {Promise<boolean>} True if recovery key is valid, false otherwise
 */
const verifyRecoveryKey = async (recoveryKey, storedHash) => {
    const hash = await hashRecoveryKey(recoveryKey);
    return hash === storedHash;
};

// Main extension logic wrapped in IIFE
(async () => {
    // State management
    const state = {
        locked: false,
        pannelOpened: false,
        pannelId: null,
        allowChange: false,
        config: null,
        passwdSet: false
    };

    /**
     * Pre-loads configuration from storage for faster startup
     * @returns {Promise<void>}
     */
    const initConfig = async () => {
        state.config = await chrome.storage.local.get();
        state.passwdSet = !!state.config.passwd;
    };

    const blocker = {
        /**
         * Initializes the blocker extension
         * @returns {Promise<void>}
         */
        init: async () => {
            // Load config first
            await initConfig();
            
            // Set up event handlers
            await blocker.handle();
            
            // If password is set, lock immediately on startup
            if (state.passwdSet) {
                state.locked = true;
                await blocker.lockPannel();
            }
        },

        /**
         * Gets configuration from storage if not already loaded
         * @returns {Promise<void>}
         */
        getConf: async () => {
            if (!state.config || state.passwdSet === null) {
                await initConfig();
            }
        },

        /**
         * Creates a SHA-256 hash digest of a message
         * @param {string} message - The message to hash
         * @returns {Promise<string>} The hex-encoded hash
         */
        digestMessage: async (message) => {
            const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        },

        /**
         * Locks the browser and shows unlock panel
         * @param {boolean} fromIcon - Whether lock was triggered from icon click
         * @returns {Promise<void>}
         */
        lock: async (fromIcon = false) => {
            const windows = await chrome.windows.getAll({ populate: true });
            state.locked = true;
            
            // Save session count
            await chrome.storage.session.set({ sessions: windows.length });
            
            // Show lock panel
            blocker.lockPannel(fromIcon);
        },

        /**
         * Unlocks the browser with the provided password
         * @param {Object} message - Message object containing password data
         * @param {Object} sender - Message sender information
         * @param {Function} sendResponse - Callback to send response
         * @returns {Promise<boolean>} False to indicate synchronous response
         */
        unlock: async (message, sender, sendResponse) => {
            await blocker.getConf();

            const passwd = message?.data?.passwd;
            const { data, salt } = state.config?.passwd || {};

            if (!data || !salt) {
                sendResponse({ type: message.type, success: false });
                return false;
            }

            const isValid = await pbkdf2.decrypt(data, passwd, salt);
            if (isValid) {
                state.locked = false;

                // Restore sessions
                const { sessions = 0 } = await chrome.storage.session.get("sessions");
                if (sessions > 0) {
                    // Restore all sessions in parallel
                    const restorePromises = Array.from({ length: sessions }, () => 
                        chrome.sessions.restore().catch(() => {})
                    );
                    await Promise.all(restorePromises);
                    await chrome.storage.session.remove("sessions");
                } else {
                    await chrome.windows.create();
                }

                sendResponse({ type: message.type, success: true });
            } else {
                sendResponse({ type: message.type, success: false });
            }
            return false;
        },

        /**
         * Sets or changes the password
         * @param {Object} message - Message object containing new and old password
         * @param {Object} sender - Message sender information
         * @param {Function} sendResponse - Callback to send response
         * @returns {Promise<void>}
         */
        passwd: async (message, sender, sendResponse) => {
            await blocker.getConf();
            const { passwdNew, passwdLast } = message?.data || {};
            const { data, salt } = state.config?.passwd || {};

            // Setting new password (no existing password)
            if (!state.config?.passwd) {
                const [resEncrypt, recoveryKey, recoveryHash] = await Promise.all([
                    pbkdf2.encrypt(passwdNew),
                    Promise.resolve(generateRecoveryKey()),
                    hashRecoveryKey(generateRecoveryKey())
                ]);
                
                state.allowChange = true;
                await chrome.storage.local.set({ 
                    passwd: resEncrypt,
                    recoveryKeyHash: recoveryHash
                });
                sendResponse({ type: "passwd", success: true, recoveryKey });
                return;
            }

            // Changing existing password
            const isValidOld = await pbkdf2.decrypt(data, passwdLast, salt);
            if (isValidOld) {
                const recoveryKey = generateRecoveryKey();
                const [resEncrypt, recoveryHash] = await Promise.all([
                    pbkdf2.encrypt(passwdNew),
                    hashRecoveryKey(recoveryKey)
                ]);
                
                state.allowChange = true;
                await chrome.storage.local.set({ 
                    passwd: resEncrypt,
                    recoveryKeyHash: recoveryHash
                });
                sendResponse({ type: "passwd", success: true, recoveryKey });
            } else {
                sendResponse({ type: "passwd", success: false });
            }
        },

        /**
         * Resets password using recovery key
         * @param {Object} message - Message object containing recovery key and new password
         * @param {Object} sender - Message sender information
         * @param {Function} sendResponse - Callback to send response
         * @returns {Promise<void>}
         */
        resetWithRecoveryKey: async (message, sender, sendResponse) => {
            await blocker.getConf();
            const { recoveryKey, newPassword } = message?.data || {};
            const storedHash = state.config?.recoveryKeyHash;

            if (!storedHash) {
                sendResponse({ type: "recovery", success: false, message: "No recovery key set" });
                return;
            }

            const isValid = await verifyRecoveryKey(recoveryKey, storedHash);
            if (isValid) {
                const newRecoveryKey = generateRecoveryKey();
                const [resEncrypt, newRecoveryHash] = await Promise.all([
                    pbkdf2.encrypt(newPassword),
                    hashRecoveryKey(newRecoveryKey)
                ]);
                
                state.allowChange = true;
                await chrome.storage.local.set({ 
                    passwd: resEncrypt,
                    recoveryKeyHash: newRecoveryHash
                });
                sendResponse({ type: "recovery", success: true, recoveryKey: newRecoveryKey });
            } else {
                sendResponse({ type: "recovery", success: false, message: "Invalid recovery key" });
            }
        },

        /**
         * Shows the lock panel and closes other windows
         * @param {boolean} fromIcon - Whether triggered from icon click
         * @returns {Promise<void>}
         */
        lockPannel: async (fromIcon = false) => {
            if (!state.locked) return;

            await blocker.getConf();

            // If no password set, show options page
            if (!state.passwdSet && fromIcon) {
                await chrome.windows.create({
                    type: "popup",
                    width: 640,
                    height: 580,
                    focused: true,
                    url: "./html/options.html"
                });
                return;
            }

            if (!state.passwdSet) return;

            // Get all windows
            const windows = await chrome.windows.getAll();

            // Create or focus unlock panel
            if (!state.pannelOpened) {
                const createdPannel = await chrome.windows.create({
                    type: "popup",
                    width: 520,
                    height: 370,
                    focused: true,
                    state: "normal",
                    url: "./html/unlock.html"
                });
                state.pannelId = createdPannel?.id;
                state.pannelOpened = true;
                
                // Close other windows (non-blocking)
                windows.forEach(win => {
                    if (win.id && win.id !== state.pannelId) {
                        chrome.windows.remove(win.id).catch(() => {});
                    }
                });
            } else {
                // If panel exists, close other windows
                const closePromises = windows
                    .filter(win => win.id && win.id !== state.pannelId)
                    .map(win => chrome.windows.remove(win.id).catch(() => {}));
                await Promise.all(closePromises);
            }
        },

        /**
         * Sets up all event listeners for the extension
         * @returns {Promise<void>}
         */
        handle: async () => {
            // Window created - lock if password is set
            chrome.windows.onCreated.addListener(() => {
                if (state.passwdSet) blocker.lockPannel();
            });

            // Browser startup - lock immediately
            chrome.runtime.onStartup.addListener(async () => {
                state.locked = true;
                await initConfig();
                await blocker.lockPannel();
            });

            // Window removed - track panel state
            chrome.windows.onRemoved.addListener(async windowId => {
                if (state.pannelId === windowId) {
                    state.pannelOpened = false;
                    state.pannelId = null;
                }
                const windows = await chrome.windows.getAll();
                if (windows.length === 0) {
                    state.locked = true;
                }
            });

            // Storage change detection (anti-tampering)
            chrome.storage.onChanged.addListener(async () => {
                if (state.allowChange) {
                    state.allowChange = false;
                    return;
                }

                // Unauthorized change detected - restore config
                await blocker.getConf();
                const newConfig = await chrome.storage.local.get();
                const [configDigest, newConfigDigest] = await Promise.all([
                    blocker.digestMessage(JSON.stringify(state.config)),
                    blocker.digestMessage(JSON.stringify(newConfig))
                ]);

                if (configDigest !== newConfigDigest) {
                    await chrome.storage.local.set(state.config);
                }
            });

            // Extension installed/updated
            chrome.runtime.onInstalled.addListener(async details => {
                if (details.reason === "install") {
                    chrome.runtime.openOptionsPage();
                } else if (details.reason === "update") {
                    await blocker.getConf();
                    state.locked = false;
                }
            });

            // Action button clicked - toggle lock
            chrome.action.onClicked.addListener(() => blocker.lock(true));
        }
    };

    // Register message handler synchronously (before any awaits).
    // In MV3, if the listener is registered only after async init, early sendMessage calls
    // (e.g., options page opening) can fail with: "Receiving end does not exist".
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const actions = {
            unlock: () => blocker.unlock(message, sender, sendResponse),
            passwd: () => blocker.passwd(message, sender, sendResponse),
            recovery: () => blocker.resetWithRecoveryKey(message, sender, sendResponse),
            config: async () => {
                await blocker.getConf();
                sendResponse({ type: "config", success: true, data: state.config });
            },
            status: () => sendResponse({
                type: "status",
                success: true,
                data: {
                    PANNEL_OPENED: state.pannelOpened,
                    LOCKED: state.locked
                }
            })
        };

        const handler = actions[message?.type];
        if (!handler) {
            return false;
        }

        try {
            handler();
        } catch (err) {
            console.error("Message handler error:", err);
            sendResponse({ type: message?.type, success: false });
        }
        return true;
    });

    // Initialize extension
    await blocker.init();
})();