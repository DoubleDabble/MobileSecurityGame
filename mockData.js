// mockData.js


// Mock question bank. Swap out for real IndexedDB calls in database.js.
export const mockQuestions = [
    {
        id: "vpn_01",
        prompt: "Does a VPN automatically encrypt ALL of your internet traffic?",
        options: ["Yes, everything", "No, only traffic routed through it", "Only on mobile networks", "Only HTTPS sites"],
        answer: 1,
        explanation: "A VPN encrypts traffic that passes through its tunnel, but traffic outside the tunnel (like DNS leaks or apps that bypass the VPN) may still be exposed."
    },
    {
        id: "auth_01",
        prompt: "Which multi-factor authentication method is considered the most secure?",
        options: ["SMS code", "Authenticator app (TOTP)", "Hardware security key", "Email link"],
        answer: 2,
        explanation: "Hardware security keys (like YubiKey) are the gold standard — they use public-key cryptography and are phishing-resistant, unlike SMS or TOTP codes."
    },
    {
        id: "pw_01",
        prompt: "Which of these passwords is the strongest?",
        options: ["P@ssw0rd!", "correct-horse-battery-staple", "Xk9!mQ2#", "12345678"],
        answer: 1,
        explanation: "Length beats complexity. A long passphrase like 'correct-horse-battery-staple' has far more entropy than a short string with symbols."
    },
    {
        id: "phish_01",
        prompt: "You receive an email from 'support@paypa1.com' asking you to verify your account. What should you do?",
        options: ["Click the link and check", "Reply to ask if it's real", "Report it as phishing and delete it", "Forward it to friends"],
        answer: 2,
        explanation: "The domain 'paypa1.com' uses a number '1' instead of 'l' — a classic lookalike domain. Always inspect sender domains carefully before clicking anything."
    },
    {
        id: "wifi_01",
        prompt: "What is the main risk of using public Wi-Fi without a VPN?",
        options: ["Slower speeds", "Higher battery drain", "Traffic can be intercepted by others on the network", "Your device might overheat"],
        answer: 2,
        explanation: "On an unencrypted public network, a malicious actor on the same network can potentially intercept unencrypted traffic via a man-in-the-middle attack."
    },
    {
        id: "update_01",
        prompt: "Why is it important to install security updates quickly?",
        options: ["For new features", "To patch known vulnerabilities before attackers exploit them", "To improve battery life", "It is not really important"],
        answer: 1,
        explanation: "Once a vulnerability is publicly disclosed, attackers race to exploit unpatched systems. Prompt updates close that window."
    }
];
