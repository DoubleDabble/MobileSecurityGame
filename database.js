// database.js — IndexedDB backend
// IndexedDB scheme
// ─────────────────────────────────────────────────────────────────
//  db name : mobileSecurityGame v2.1
//
// ─── adding questions ───────────────────────────────────
// 1. Append objects to question_seed(follow same shape)
// 3. upgrade handler will add any new questions automatically
// ─────────────────────────────────────────────────────────────────

const DB_NAME    = 'MobileSecurityGame';
const DB_VERSION = 2;  //  bump this when adding questions

// ═══════════════════════════════════════════════════════════════════
// QUESTION SEED — 20 total (6 multiple choice, 14 new: 6 MC + 8 T/F)
// Add new questions here. Each object must have:
//   id          – unique string (used as the IndexedDB key)
//   prompt      – the question text shown to the player
//   options     – array of answer strings (2–6 items)
//   answer      – zero-based index of the correct option
//   hint        – a nudge shown if the player asks for a hint
//   explanation – shown in the feedback overlay after answering
// ═══════════════════════════════════════════════════════════════════
const QUESTION_SEED = [

    // ── ORIGINAL 6 — multiple Choice ────────────────────────────────
    {
        id: 'vpn_01',
        prompt: 'Does a VPN automatically encrypt ALL of your internet traffic?',
        options: [
            'Yes, everything',
            'No, only traffic routed through it',
            'Only on mobile networks',
            'Only HTTPS sites'
        ],
        answer: 1,
        hint: 'Think about what happens to apps that route traffic outside the VPN tunnel.',
        explanation:
            'A VPN encrypts traffic that passes through its tunnel, but traffic outside ' +
            'the tunnel (like DNS leaks or apps that bypass the VPN) may still be exposed.'
    },
    {
        id: 'auth_01',
        prompt: 'Which multi-factor authentication method is considered the most secure?',
        options: [
            'SMS code',
            'Authenticator app (TOTP)',
            'Hardware security key',
            'Email link'
        ],
        answer: 2,
        hint: 'Consider which method is immune to phishing and does not rely on a network carrier.',
        explanation:
            'Hardware security keys (like YubiKey) are the gold standard. They use ' +
            'public-key cryptography and are phishing-resistant, unlike SMS or TOTP codes.'
    },
    {
        id: 'pw_01',
        prompt: 'Which of these passwords is the strongest?',
        options: [
            'P@ssw0rd!',
            'correct-horse-battery-staple',
            'Xk9!mQ2#',
            '12345678'
        ],
        answer: 1,
        hint: 'Entropy increases with length. Which option has the most characters?',
        explanation:
            'Length beats complexity. A long passphrase like "correct-horse-battery-staple" ' +
            'has far more entropy than a short string with symbols.'
    },
    {
        id: 'phish_01',
        prompt: 'You receive an email from "support@paypa1.com" asking you to verify your account. What should you do?',
        options: [
            'Click the link and check',
            'Reply to ask if it\'s real',
            'Report it as phishing and delete it',
            'Forward it to friends'
        ],
        answer: 2,
        hint: 'Look very carefully at the domain name — is every character what it appears to be?',
        explanation:
            'The domain "paypa1.com" uses a number "1" instead of "l", a classic lookalike ' +
            'domain. Always inspect sender domains carefully before clicking anything.'
    },
    {
        id: 'wifi_01',
        prompt: 'What is the main risk of using public Wi-Fi without a VPN?',
        options: [
            'Slower speeds',
            'Higher battery drain',
            'Traffic can be intercepted by others on the network',
            'Your device might overheat'
        ],
        answer: 2,
        hint: 'Think about who else might be connected to the same network and what they could see.',
        explanation:
            'On an unencrypted public network, a malicious actor on the same network can ' +
            'potentially intercept unencrypted traffic via a man-in-the-middle attack.'
    },
    {
        id: 'update_01',
        prompt: 'Why is it important to install security updates quickly?',
        options: [
            'For new features',
            'To patch known vulnerabilities before attackers exploit them',
            'To improve battery life',
            'It is not really important'
        ],
        answer: 1,
        hint: 'Once a vulnerability is made public, how long do you think it takes attackers to act on it?',
        explanation:
            'Once a vulnerability is publicly disclosed, attackers race to exploit unpatched ' +
            'systems. Prompt updates close that window.'
    },

    // ── new 6 —  multiple choice ──────────────────────────────────────
    {
        id: 'malware_01',
        prompt: 'Which of the following is the most common way malware is installed on a mobile device?',
        options: [
            'Through official app stores only',
            'By downloading apps from untrusted third-party sources',
            'Via Bluetooth automatically',
            'Through the phone\'s charging cable'
        ],
        answer: 1,
        hint: 'Think about where apps come from when they are not downloaded from an official store.',
        explanation:
            'Sideloading apps from untrusted third-party sources bypasses the security ' +
            'review process of official stores, making it the most common malware entry point on mobile devices.'
    },
    {
        id: 'perm_01',
        prompt: 'A flashlight app requests access to your contacts, microphone, and location. What should you do?',
        options: [
            'Accept all',
            'Deny all permissions and uninstall the app',
            'Accept only location since flashlights need GPS',
            'Accept microphone only'
        ],
        answer: 1,
        hint: 'Ask yourself: what does a flashlight actually need to function?',
        explanation:
            'A flashlight only needs access to the camera flash. Requests for contacts, ' +
            'microphone, or location are red flags indicating the app may be harvesting data.'
    },
    {
        id: 'social_01',
        prompt: 'What type of attack involves manipulating a person into revealing confidential information rather than exploiting software?',
        options: [
            'Brute force attack',
            'SQL injection',
            'Social engineering',
            'Buffer overflow'
        ],
        answer: 2,
        hint: 'This attack targets the human, not the machine.',
        explanation:
            'Social engineering exploits human psychology rather than technical vulnerabilities. ' +
            'Attackers pose as trusted figures to trick victims into revealing passwords or sensitive data.'
    },
    {
        id: 'enc_01',
        prompt: 'What does enabling full-device encryption on your mobile phone protect against?',
        options: [
            'Remote hacking over the internet',
            'Data being read if the physical device is stolen',
            'Malicious apps already installed',
            'SIM card cloning'
        ],
        answer: 1,
        hint: 'Encryption protects data at rest, think about what happens when someone has the physical device.',
        explanation:
            'Full-device encryption scrambles stored data so that without the correct PIN or ' +
            'password, someone with physical access to the device cannot read its contents.'
    },
    {
        id: 'sim_01',
        prompt: 'What is a SIM swapping attack?',
        options: [
            'Physically stealing a SIM card from a phone',
            'Remotely wiping a phone\'s SIM data',
            'Tricking a carrier into transferring your number to an attacker\'s SIM',
            'Installing spyware via a SIM card update'
        ],
        answer: 2,
        hint: 'The attacker does not need your physical SIM — they just need to convince someone.',
        explanation:
            'In a SIM swap attack, the attacker convinces your mobile carrier to transfer your ' +
            'phone number to a SIM they control, letting them intercept SMS-based authentication codes.'
    },
    {
        id: 'backup_01',
        prompt: 'Which backup strategy best protects your mobile data against ransomware?',
        options: [
            'One backup stored on the same device',
            'Cloud backup only, synced in real time',
            'Multiple backups including one offline copy not connected to your network',
            'Emailing important files to yourself'
        ],
        answer: 2,
        hint: 'Ransomware encrypts everything it can reach — consider what it cannot reach.',
        explanation:
            'An offline backup that is not connected to your network cannot be encrypted by ' +
            'ransomware. The 3-2-1 rule: 3 copies, 2 media types, 1 offsite is the gold standard.'
    },

    // ── new 8 — True / False ─────────────────────────────────────────
    {
        id: 'tf_https_01',
        prompt: 'True or False: A website using HTTPS means it is completely safe and cannot be malicious.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'HTTPS tells you the connection is encrypted — but does it say anything about who runs the site?',
        explanation:
            'HTTPS only means the connection between you and the site is encrypted. ' +
            'Attackers can and do run phishing sites with valid HTTPS certificates. ' +
            'Encryption does not guarantee the site itself is trustworthy.'
    },
    {
        id: 'tf_airplane_01',
        prompt: 'True or False: Putting your phone in airplane mode while connected to a suspicious Wi-Fi network immediately stops all data transmission.',
        options: ['True', 'False'],
        answer: 0,
        hint: 'Airplane mode disables all radios — Wi-Fi, cellular, and Bluetooth.',
        explanation:
            'True — airplane mode disables all wireless radios including Wi-Fi, cutting off ' +
            'any active data transmission immediately. It is a fast way to isolate the device ' +
            'if you suspect a network attack.'
    },
    {
        id: 'tf_charging_01',
        prompt: 'True or False: Charging your phone at a public USB charging station is always safe.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'USB cables carry both power and data — think about what a modified port could do.',
        explanation:
            'False — public USB ports can be compromised in an attack called "juice jacking," ' +
            'where a malicious port transfers malware or steals data while charging your device. ' +
            'Use a power-only USB adapter or your own charger to stay safe.'
    },
    {
        id: 'tf_lock_01',
        prompt: 'True or False: A 6-digit PIN is always more secure than a fingerprint for locking your phone.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'Consider what can be legally compelled versus what requires active cooperation.',
        explanation:
            'False — neither is strictly more secure in all situations. A fingerprint can be ' +
            'compelled by law enforcement or replicated from surfaces you have touched. A PIN ' +
            'requires knowledge that only you hold. Each has trade-offs depending on the threat model.'
    },
    {
        id: 'tf_guest_wifi_01',
        prompt: 'True or False: Using a guest Wi-Fi network at a hotel is safer than using the main staff network.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'Who else is on the guest network, and can they see your traffic?',
        explanation:
            'False — guest networks are shared with many unknown users and are often unencrypted ' +
            'between devices. Other guests on the same network may be able to intercept your traffic. ' +
            'A VPN is strongly recommended on any public or guest network.'
    },
    {
        id: 'tf_antivirus_01',
        prompt: 'True or False: Mobile operating systems are immune to viruses and do not benefit from security software.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'Think about what happens when apps are sideloaded or a zero-day exploit is found.',
        explanation:
            'False — while iOS and Android have strong sandboxing, neither is immune. ' +
            'Malicious apps, spyware, and zero-day exploits have all been documented on mobile platforms. ' +
            'Security software and good habits both matter.'
    },
    {
        id: 'tf_2fa_01',
        prompt: 'True or False: Enabling two-factor authentication (2FA) on an account makes it impossible to hack.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'Think about SIM swapping, real-time phishing proxies, and SS7 vulnerabilities.',
        explanation:
            'False — 2FA significantly raises the bar but is not foolproof. SMS-based 2FA can ' +
            'be bypassed via SIM swapping or SS7 attacks. Even TOTP codes can be stolen by ' +
            'real-time phishing proxies. 2FA greatly reduces risk but does not eliminate it.'
    },
    {
        id: 'tf_delete_01',
        prompt: 'True or False: Deleting an app from your phone completely removes all data it stored on your device.',
        options: ['True', 'False'],
        answer: 1,
        hint: 'Think about cached files, shared storage folders, and cloud data the app may have written.',
        explanation:
            'False — some apps write data to shared storage locations or cache folders that ' +
            'persist after uninstallation. On Android especially, residual files can remain. ' +
            'To be thorough, clear the app\'s data before uninstalling and check for leftover folders.'
    },

    // ── Add more questions below this line ──────────────────────────
    // Copy the block format above. Remember to bump DB_VERSION too.
    // {
    //     id: 'example_01',
    //     prompt: 'Your question here?',
    //     options: ['Option A', 'Option B', 'Option C', 'Option D'],
    //     answer: 0,
    //     hint: 'A nudge without giving it away.',
    //     explanation: 'Why the correct answer is correct.'
    // },
];

// ═══════════════════════════════════════════════════════════════════
// password helpers (exported — used by app.js)
// ═══════════════════════════════════════════════════════════════════

/** Returns an array of unmet requirements (empty = valid) */
export function validatePassword(password) {
    const errors = [];
    if (password.length < 10)         errors.push('At least 10 characters.');
    if (!/[A-Z]/.test(password))      errors.push('At least 1 uppercase letter.');
    if (!/[0-9]/.test(password))      errors.push('At least 1 number.');
    return errors;
}

/** Returns a 0-5 strength score (used by the live strength meter) */
export function passwordStrength(password) {
    let score = 0;
    if (password.length >= 10) score++;
    if (password.length >= 14) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

// ═══════════════════════════════════════════════════════════════════
// INTERNAL — IndexedDB helpers
// ═══════════════════════════════════════════════════════════════════

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('accounts')) {
                db.createObjectStore('accounts', { keyPath: 'username' });
            }

            let qStore;
            if (!db.objectStoreNames.contains('questions')) {
                qStore = db.createObjectStore('questions', { keyPath: 'id' });
            } else {
                qStore = event.target.transaction.objectStore('questions');
            }

            QUESTION_SEED.forEach(q => qStore.put(q));
        };

        req.onsuccess = (event) => resolve(event.target.result);
        req.onerror   = (event) => reject(event.target.error);
    });
}

function idbRequest(storeName, mode, action) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx      = db.transaction(storeName, mode);
        const store   = tx.objectStore(storeName);
        const req     = action(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

function getAll(storeName) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx    = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req   = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

// SHA-256 hash — keeps passwords out of plain text in IndexedDB
async function hashPassword(password) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API  — identical surface to the old localStorage version
// ═══════════════════════════════════════════════════════════════════
export const Database = {

    async fetchQuestions() {
        const questions = await getAll('questions');
        return questions.length ? questions : [...QUESTION_SEED];
    },

    async registerUser(username, password) {
        const key = username.trim().toLowerCase();

        if (!key || key.length < 2)
            return { ok: false, error: 'Username must be at least 2 characters.' };
        if (!/^[a-z0-9_]+$/.test(key))
            return { ok: false, error: 'Username can only contain letters, numbers, and underscores.' };

        const pwErrors = validatePassword(password);
        if (pwErrors.length)
            return { ok: false, error: pwErrors.join(' • ') };

        const existing = await idbRequest('accounts', 'readonly', s => s.get(key));
        if (existing)
            return { ok: false, error: 'That username is already taken.' };

        const hash = await hashPassword(password);
        await idbRequest('accounts', 'readwrite', s =>
            s.put({ username: key, passwordHash: hash, highScore: 0 })
        );
        return { ok: true, username: username.trim() };
    },

    async loginUser(username, password) {
        const key    = username.trim().toLowerCase();
        const record = await idbRequest('accounts', 'readonly', s => s.get(key));
        if (!record)
            return { ok: false, error: 'No account found with that username.' };

        const hash = await hashPassword(password);
        if (hash !== record.passwordHash)
            return { ok: false, error: 'Incorrect password.' };

        return { ok: true, username: username.trim(), highScore: record.highScore };
    },

    async saveHighScore(username, score) {
        if (!username) return;
        const key    = username.trim().toLowerCase();
        const record = await idbRequest('accounts', 'readonly', s => s.get(key));
        if (!record) return;

        if (score > record.highScore) {
            await idbRequest('accounts', 'readwrite', s =>
                s.put({ ...record, highScore: score })
            );
        }
    },

    async getHighScore(username) {
        if (!username) return 0;
        const key    = username.trim().toLowerCase();
        const record = await idbRequest('accounts', 'readonly', s => s.get(key));
        return record?.highScore ?? 0;
    },

    async getLeaderboard() {
        const accounts = await getAll('accounts');
        return accounts
            .filter(a => a.highScore > 0)
            .sort((a, b) => b.highScore - a.highScore)
            .map(a => ({ username: a.username, highScore: a.highScore }));
    }
};
