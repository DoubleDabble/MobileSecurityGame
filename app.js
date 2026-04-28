// app.js — Central controller.
// Flow: Title → (Scores | Quit | Start→AuthChoice) → Login/Register/Guest → Game → GameOver → repeat
// Database API changes only need updating in database.js.

import { GameLogic }                          from './gameLogic.js';
import { Database, validatePassword, passwordStrength } from './database.js';
import { Renderer }                           from './renderer.js';

const logic = new GameLogic();
let currentUser = null; // null = guest, string = logged-in username

// ═══════════════════════════════════════════════════════════════════
// INIT — wire PNG button press visuals for static buttons
// ═══════════════════════════════════════════════════════════════════
Renderer.initPngButtons();

// ── Background image per screen ──────────────────────────────────────────────
// Maps screen IDs to the body class that loads the right bg PNG.
// Change the class names here if you rename your PNG files.
const BG_MAP = {
    'screen-title':       'bg-title',
    'screen-auth-choice': 'bg-auth',
    'screen-login':       'bg-auth',
    'screen-register':    'bg-auth',
    'screen-game':        'bg-game',
};
function setBodyBg(screenId) {
    document.body.classList.remove('bg-title', 'bg-auth', 'bg-game');
    const cls = BG_MAP[screenId];
    if (cls) document.body.classList.add(cls);
}
// Set title bg on first load
setBodyBg('screen-title');

// ═══════════════════════════════════════════════════════════════════
// TITLE SCREEN
// ═══════════════════════════════════════════════════════════════════
document.getElementById('btn-start-play').addEventListener('click', () => {
    setBodyBg('screen-auth-choice'); Renderer.showScreen('screen-auth-choice');
});

document.getElementById('btn-scoreboard').addEventListener('click', async () => {
    const entries = await Database.getLeaderboard();
    Renderer.showScoreboard(entries);
});

document.getElementById('btn-quit').addEventListener('click', () => {
    Renderer.showQuitConfirm(
        () => { window.close(); },  // confirm — tries to close tab
        () => {}                    // cancel — do nothing
    );
});

document.getElementById('btn-close-scoreboard').addEventListener('click', () => {
    Renderer.hideScoreboard();
});

// ═══════════════════════════════════════════════════════════════════
// AUTH CHOICE SCREEN (after pressing Start)
// ═══════════════════════════════════════════════════════════════════
document.getElementById('btn-login').addEventListener('click', () => {
    setBodyBg('screen-login'); Renderer.showScreen('screen-login');
});

document.getElementById('btn-register').addEventListener('click', () => {
    setBodyBg('screen-register'); Renderer.showScreen('screen-register');
});

document.getElementById('btn-guest').addEventListener('click', () => {
    startAsGuest();
});

document.getElementById('link-back-from-choice').addEventListener('click', () => {
    setBodyBg('screen-title'); Renderer.showScreen('screen-title');
});

// ═══════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════
document.getElementById('link-to-register').addEventListener('click', () => {
    clearLoginForm();
    setBodyBg('screen-register'); Renderer.showScreen('screen-register');
});

document.getElementById('link-back-title').addEventListener('click', () => {
    clearLoginForm();
    setBodyBg('screen-auth-choice'); Renderer.showScreen('screen-auth-choice');
});

document.getElementById('btn-guest2').addEventListener('click', () => {
    startAsGuest();
});

document.getElementById('btn-do-login').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    Renderer.clearFormErrors('login-error', 'login-pw-error');
    Renderer.setInputError('login-username', false);
    Renderer.setInputError('login-password', false);

    if (!username) {
        Renderer.setInputError('login-username', true);
        Renderer.setFormError('login-error', 'Please enter your username.');
        return;
    }
    if (!password) {
        Renderer.setInputError('login-password', true);
        Renderer.setFormError('login-error', 'Please enter your password.');
        return;
    }

    const btn = document.getElementById('btn-do-login');
    btn.textContent = 'Logging in…';
    btn.disabled = true;

    const result = await Database.loginUser(username, password);

    btn.textContent = 'Log In';
    btn.disabled = false;

    if (!result.ok) {
        Renderer.setFormError('login-error', result.error);
        return;
    }

    currentUser = result.username;
    clearLoginForm();
    await launchGame();
});

['login-username', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btn-do-login').click();
    });
});

function clearLoginForm() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    Renderer.clearFormErrors('login-error', 'login-pw-error');
    Renderer.setInputError('login-username', false);
    Renderer.setInputError('login-password', false);
}

// ═══════════════════════════════════════════════════════════════════
// REGISTER SCREEN
// ═══════════════════════════════════════════════════════════════════
document.getElementById('link-to-login').addEventListener('click', () => {
    clearRegisterForm();
    setBodyBg('screen-login'); Renderer.showScreen('screen-login');
});

document.getElementById('link-back-title2').addEventListener('click', () => {
    clearRegisterForm();
    setBodyBg('screen-auth-choice'); Renderer.showScreen('screen-auth-choice');
});

// Live password strength meter
document.getElementById('reg-password').addEventListener('input', () => {
    const pw    = document.getElementById('reg-password').value;
    const wrap  = document.getElementById('pw-strength-wrap');
    const fill  = document.getElementById('pw-fill');
    const label = document.getElementById('pw-label');

    if (!pw) { wrap.classList.remove('visible'); return; }
    wrap.classList.add('visible');

    const score = passwordStrength(pw);
    fill.style.width = `${(score / 5) * 100}%`;

    const tiers = [
        { max: 1, color: '#F36B6B', text: 'Too weak', textColor: '#c03f3f' },
        { max: 2, color: '#FFB347', text: 'Weak',      textColor: '#b07000' },
        { max: 3, color: '#FFD93D', text: 'Fair',      textColor: '#8a6000' },
        { max: 4, color: '#4BCB74', text: 'Good',      textColor: '#2a7a3a' },
        { max: 5, color: '#2da055', text: 'Strong',    textColor: '#1a5c30' },
    ];
    const tier = tiers.find(t => score <= t.max) || tiers[4];
    fill.style.background = tier.color;
    label.textContent     = tier.text;
    label.style.color     = tier.textColor;
});

document.getElementById('btn-do-register').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    Renderer.clearFormErrors('reg-error', 'reg-username-error', 'reg-pw-error', 'reg-confirm-error');
    Renderer.setInputError('reg-username', false);
    Renderer.setInputError('reg-password', false);
    Renderer.setInputError('reg-confirm',  false);

    let hasError = false;

    if (!username) {
        Renderer.setFieldError('reg-username-error', 'Username is required.');
        Renderer.setInputError('reg-username', true);
        hasError = true;
    }

    const pwErrors = validatePassword(password);
    if (pwErrors.length) {
        Renderer.setFieldError('reg-pw-error', pwErrors.join(' • '));
        Renderer.setInputError('reg-password', true);
        hasError = true;
    }

    if (password !== confirm) {
        Renderer.setFieldError('reg-confirm-error', 'Passwords do not match.');
        Renderer.setInputError('reg-confirm', true);
        hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('btn-do-register');
    btn.textContent = 'Creating account…';
    btn.disabled = true;

    const result = await Database.registerUser(username, password);

    btn.textContent = 'Create Account';
    btn.disabled = false;

    if (!result.ok) {
        Renderer.setFormError('reg-error', result.error);
        return;
    }

    currentUser = result.username;
    clearRegisterForm();
    await launchGame();
});

['reg-username', 'reg-password', 'reg-confirm'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btn-do-register').click();
    });
});

function clearRegisterForm() {
    ['reg-username', 'reg-password', 'reg-confirm'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('pw-strength-wrap').classList.remove('visible');
    Renderer.clearFormErrors('reg-error', 'reg-username-error', 'reg-pw-error', 'reg-confirm-error');
    ['reg-username', 'reg-password', 'reg-confirm'].forEach(id => {
        Renderer.setInputError(id, false);
    });
}

// ═══════════════════════════════════════════════════════════════════
// GAME LAUNCH
// ═══════════════════════════════════════════════════════════════════
function startAsGuest() {
    currentUser = null;
    launchGame();
}

async function launchGame() {
    setBodyBg('screen-game'); Renderer.showScreen('screen-game');
    Renderer.setUsername(currentUser || 'Guest');
    Renderer.updateScore(0);
    Renderer.updateProgress(0);

    // Restore the question card and options container if they were ever removed
    // (they shouldn't be now, but this is defensive)
    const gameBody = document.querySelector('.game-body');
    if (!document.getElementById('question-card')) {
        gameBody.innerHTML = `
            <div class="question-card" id="question-card">
                <div class="question-number" id="question-number">Question 1</div>
                <h2 id="question_text">
                    <div class="loading-dots"><span></span><span></span><span></span></div>
                </h2>
            </div>
            <div id="options_container"></div>`;
    }

    const questions = await Database.fetchQuestions();
    logic.init(questions);

    displayCurrentQuestion();
}

// ═══════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════
function displayCurrentQuestion() {
    const q = logic.getCurrentQuestion();
    Renderer.renderQuestion(
        q,
        logic.questionNumber,
        logic.totalQuestions,
        (choiceIndex) => handleAnswer(choiceIndex)
    );
    Renderer.updateScore(logic.score);
    Renderer.updateProgress(logic.progress);
}

function handleAnswer(choiceIndex) {
    const result = logic.processAnswer(choiceIndex);

    Renderer.showFeedback(result.isCorrect, result.explanation, async () => {
        if (result.hasNext) {
            Renderer.updateProgress(logic.progress);
            displayCurrentQuestion();
        } else {
            Renderer.updateScore(result.score);
            Renderer.updateProgress(100);

            await Database.saveHighScore(currentUser, result.score);
            const best = await Database.getHighScore(currentUser);

            Renderer.showGameOver(
                result.score,
                best,
                currentUser === null,
                () => launchGame(),       // Play Again — launchGame re-inits logic & re-renders
                () => {                   // Main Menu
                    currentUser = null;
                    setBodyBg('screen-title'); Renderer.showScreen('screen-title');
                }
            );
        }
    });
}
