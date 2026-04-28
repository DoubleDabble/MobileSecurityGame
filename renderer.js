// renderer.js


// Renderer: owns all DOM reads and writes. No game logic lives here.

export const Renderer = {

    // ── PNG Button Press System ────────────────────────────────────────────
    // Call once at startup to wire all static .png-btn elements.
    initPngButtons() {
        document.querySelectorAll('.png-btn').forEach(btn => {
            const img = btn.querySelector('img');
            if (!img) return;
            const idle    = btn.dataset.idle    || img.src;
            const pressed = btn.dataset.pressed || img.src;

            const press   = () => { img.src = pressed; btn.classList.add('pressed'); };
            const release = () => { img.src = idle;    btn.classList.remove('pressed'); };

            btn.addEventListener('mousedown',  press);
            btn.addEventListener('touchstart', press, { passive: true });
            btn.addEventListener('mouseup',    release);
            btn.addEventListener('mouseleave', release);
            btn.addEventListener('touchend',   release);
        });
    },

    // ── Question & Options ─────────────────────────────────────────────────
    renderQuestion(question, questionNumber, total, onChoiceSelected) {
        document.getElementById('question_text').textContent = question.prompt;
        document.getElementById('question-number').textContent =
            `Question ${questionNumber} of ${total}`;

        const container = document.getElementById('options_container');
        container.innerHTML = '';

        question.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-png-btn';

            // PNG background
            const img = document.createElement('img');
            img.src = 'button.png';
            img.alt = '';
            img.onerror = () => { img.style.opacity = '0'; };

            // Text label on top
            const labelEl = document.createElement('span');
            labelEl.className = 'option-png-btn-label';
            labelEl.textContent = option;

            btn.appendChild(img);
            btn.appendChild(labelEl);

            // Press/release visual
            const press   = () => { img.src = 'buttonpressed.png'; btn.classList.add('pressed'); };
            const release = () => { img.src = 'button.png';        btn.classList.remove('pressed'); };
            btn.addEventListener('mousedown',  press);
            btn.addEventListener('touchstart', press, { passive: true });
            btn.addEventListener('mouseup',    release);
            btn.addEventListener('mouseleave', release);
            btn.addEventListener('touchend',   release);

            btn.onclick = () => {
                container.querySelectorAll('.option-png-btn').forEach(b => { b.disabled = true; });
                onChoiceSelected(index);
            };

            container.appendChild(btn);
        });
    },

    // ── Score & Progress ──────────────────────────────────────────────────
    updateScore(score) {
        document.getElementById('score_display').textContent = score;
    },

    updateProgress(percent) {
        document.getElementById('progress-fill').style.width = `${Math.min(100, percent)}%`;
    },

    setUsername(name) {
        document.getElementById('display-username').textContent = name || 'Guest';
    },

    // ── Feedback Overlay ──────────────────────────────────────────────────
    showFeedback(isCorrect, explanation, onDismiss) {
        const overlay     = document.getElementById('feedback_overlay');
        const iconEl      = document.getElementById('feedback-icon');
        const resultEl    = document.getElementById('feedback-result');
        const exEl        = document.getElementById('feedback-explanation');
        const continueBtn = document.getElementById('feedback-continue');

        iconEl.textContent   = isCorrect ? '✅' : '❌';
        resultEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
        resultEl.className   = `feedback-result ${isCorrect ? 'correct' : 'incorrect'}`;
        exEl.textContent     = explanation || '';

        overlay.classList.remove('hidden');

        // Clone to drop any stale listener from a previous question
        const fresh = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(fresh, continueBtn);
        fresh.onclick = () => {
            overlay.classList.add('hidden');
            onDismiss();
        };
    },

    // ── Game Over ─────────────────────────────────────────────────────────
    // Uses a dedicated overlay — does NOT wipe .game-body innerHTML.
    // This is the root cause fix: Play Again can now re-render into the
    // still-intact question card and options container.
    showGameOver(finalScore, highScore, isGuest, onPlayAgain, onMenu) {
        const overlay      = document.getElementById('gameover_overlay');
        const trophyEl     = document.getElementById('gameover-trophy');
        const scoreEl      = document.getElementById('gameover-score');
        const labelEl      = document.getElementById('gameover-label');
        const recordEl     = document.getElementById('gameover-newrecord');
        const guestMsgEl   = document.getElementById('gameover-guest-msg');
        const playAgainBtn = document.getElementById('btn-play-again');
        const menuBtn      = document.getElementById('btn-to-menu');

        const isNewRecord = !isGuest && finalScore > 0 && finalScore >= highScore;

        trophyEl.textContent     = isNewRecord ? '🏆' : '🎮';
        scoreEl.textContent      = finalScore;
        labelEl.textContent      = isGuest
            ? 'points (guest)'
            : `points · best: ${Math.max(finalScore, highScore)}`;
        recordEl.style.display   = isNewRecord ? 'block' : 'none';
        guestMsgEl.style.display = isGuest    ? 'block' : 'none';

        overlay.classList.remove('hidden');

        // Clone to clear old listeners
        const freshPlay = playAgainBtn.cloneNode(true);
        playAgainBtn.parentNode.replaceChild(freshPlay, playAgainBtn);
        freshPlay.onclick = () => { overlay.classList.add('hidden'); onPlayAgain(); };

        const freshMenu = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(freshMenu, menuBtn);
        freshMenu.onclick = () => { overlay.classList.add('hidden'); onMenu(); };
    },

    // ── Scoreboard Modal ──────────────────────────────────────────────────
    showScoreboard(entries) {
        const overlay = document.getElementById('scoreboard_overlay');
        const body    = document.getElementById('leaderboard-body');
        const medals  = ['🥇', '🥈', '🥉'];

        if (!entries || entries.length === 0) {
            body.innerHTML = '<p class="lb-empty">No scores yet — play a game to get on the board!</p>';
        } else {
            const rows = entries.map((e, i) => `
                <tr>
                    <td><span class="lb-rank">${medals[i] || `#${i + 1}`}</span></td>
                    <td>${escapeHtml(e.username)}</td>
                    <td>${e.highScore}</td>
                </tr>`).join('');

            body.innerHTML = `
                <table class="lb-table">
                    <thead><tr>
                        <th style="width:40px;">#</th>
                        <th>Player</th>
                        <th>Best Score</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>`;
        }

        overlay.classList.remove('hidden');
    },

    hideScoreboard() {
        document.getElementById('scoreboard_overlay').classList.add('hidden');
    },

    // ── Quit Confirm Modal ────────────────────────────────────────────────
    showQuitConfirm(onConfirm, onCancel) {
        const overlay    = document.getElementById('quit_overlay');
        const confirmBtn = document.getElementById('btn-quit-confirm');
        const cancelBtn  = document.getElementById('btn-quit-cancel');

        overlay.classList.remove('hidden');

        const freshConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(freshConfirm, confirmBtn);
        freshConfirm.onclick = () => { overlay.classList.add('hidden'); onConfirm(); };

        const freshCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
        freshCancel.onclick = () => { overlay.classList.add('hidden'); onCancel(); };
    },

    // ── Screen Navigation ─────────────────────────────────────────────────
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            target.scrollTop = 0;
        }
    },

    // ── Form helpers ──────────────────────────────────────────────────────
    setFieldError(fieldId, message) {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.textContent = message || '';
        el.classList.toggle('visible', !!message);
    },

    setFormError(formId, message) {
        const el = document.getElementById(formId);
        if (!el) return;
        el.textContent = message || '';
        el.classList.toggle('visible', !!message);
    },

    clearFormErrors(...ids) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = ''; el.classList.remove('visible'); }
        });
    },

    setInputError(inputId, hasError) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.classList.toggle('error', hasError);
    }
};

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
