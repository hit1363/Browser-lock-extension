const ITERATION_TIMES = 102400;
const SALT_LENGTH = 64;

const arrayBufferToHex = (buffer) => {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const hexToArrayBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
};

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

const pbkdf2 = { encrypt, decrypt };


;
(async () => {
    let LOCKED = false;
    let PANNEL_OPENED = false;
    let PANNEL_ID = null;
    let ALLOW_CHANGE = false;

    let config = null;
    let PASSWD_SETED = null;

    const blocker = {
        init: async () => await blocker.handle(),

        getConf: async () => {
            if (config === null || PASSWD_SETED === null) {
                config = await chrome.storage.local.get();
                PASSWD_SETED = !!config.passwd;
            }
        },

        digestMessage: async (message) => {
            const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        },

        lock: async (fromIcon = false) => {
            const { length: sessionCount } = await chrome.windows.getAll({ populate: true });

            LOCKED = true;
            blocker.lockPannel(fromIcon);

            await chrome.storage.session.set({ sessions: sessionCount });
        },

        unlock: async (message, sender, sendResponse) => {
            await blocker.getConf();

            const passwd = message?.data?.passwd;
            const { data, salt } = config?.passwd || {};

            const resDecrypt = await pbkdf2.decrypt(data, passwd, salt);
            if (resDecrypt) {
                LOCKED = false;

                let sessions = (await chrome.storage.session.get("sessions")).sessions;
                if (sessions > 0) {
                    while (sessions > 0) {
                        await chrome.sessions.restore();
                        sessions--;
                    }
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

        passwd: async (message, sender, sendResponse) => {
            await blocker.getConf();
            const { passwdNew, passwdLast } = message?.data || {};
            const { data, salt } = config?.passwd || {};

            if (!config?.passwd) {
                const resEncrypt = await pbkdf2.encrypt(passwdNew);
                ALLOW_CHANGE = true;
                await chrome.storage.local.set({ passwd: resEncrypt });
                sendResponse({ type: "passwd", success: true });
            } else {
                const resDecrypt = await pbkdf2.decrypt(data, passwdLast, salt);
                if (resDecrypt) {
                    const resEncrypt = await pbkdf2.encrypt(passwdNew);
                    ALLOW_CHANGE = true;
                    await chrome.storage.local.set({ passwd: resEncrypt });
                    sendResponse({ type: "passwd", success: true });
                } else {
                    sendResponse({ type: "passwd", success: false });
                }
            }
        },

        lockPannel: async (fromIcon = false) => {
            if (!LOCKED) return;

            await blocker.getConf();

            if (!PASSWD_SETED) {
                if (fromIcon) {
                    await chrome.windows.create({
                        type: "popup",
                        width: 640,
                        height: 580,
                        focused: true,
                        url: "./html/options.html"
                    });
                }
                return;
            }


            const windows = await chrome.windows.getAll();

            if (!PANNEL_OPENED) {
                const createdPannel = await chrome.windows.create({
                    type: "popup",
                    width: 520,
                    height: 370,
                    focused: true,
                    url: PASSWD_SETED ? "./html/unlock.html" : "./html/options.html"
                });
                PANNEL_ID = createdPannel?.id;
                PANNEL_OPENED = true;
            }
            await Promise.all(
                windows.map(win => win.id && win.id !== PANNEL_ID && chrome.windows.remove(win.id))
            );
        },

        handle: async () => {
            chrome.windows.onCreated.addListener(() => blocker.lockPannel());

            chrome.runtime.onStartup.addListener(() => {
                LOCKED = true;
                blocker.lockPannel();
            });

            chrome.windows.onRemoved.addListener(async windowId => {
                if (PANNEL_ID === windowId) {
                    PANNEL_OPENED = false;
                    PANNEL_ID = null;
                }
                if ((await chrome.windows.getAll()).length === 0) {
                    LOCKED = true;
                }
            });

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                const actions = {
                    unlock: () => blocker.unlock(message, sender, sendResponse),
                    passwd: () => blocker.passwd(message, sender, sendResponse),
                    config: () => {
                        blocker.getConf().then(() => {
                            sendResponse({ type: "config", success: true, data: config });
                        });
                    },
                    status: () => sendResponse({ type: "status", success: true, data: { PANNEL_OPENED, LOCKED } })
                };

                if (actions[message.type]) actions[message.type]();
                return true;
            });

            chrome.storage.onChanged.addListener(async (changes) => {
                await blocker.getConf();

                if (ALLOW_CHANGE) {
                    ALLOW_CHANGE = false;
                    return;
                }

                const newConfig = await chrome.storage.local.get();
                const [configDigest, newConfigDigest] = await Promise.all([
                    blocker.digestMessage(JSON.stringify(config)),
                    blocker.digestMessage(JSON.stringify(newConfig))
                ]);

                if (configDigest !== newConfigDigest) {
                    await chrome.storage.local.set(config);
                }
            });

            chrome.runtime.onInstalled.addListener(async details => {
                if (details.reason === "install") {
                    chrome.runtime.openOptionsPage();
                } else if (details.reason === "update") {
                    await blocker.getConf();
                    LOCKED = false;
                }
            });

            chrome.action.onClicked.addListener(() => blocker.lock(true));
        }
    };

    await blocker.init();
})();