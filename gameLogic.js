// gameLogic.js


export class GameLogic {
    constructor() {
        this.score = 0;
        this.currentIndex = 0;
        this.questions = [];
    }

    // Fisher-Yates shuffle — fixed loop direction (was i < 0, should be i > 0)
    #shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    #shuffleOptions(question) {
    	const correct = question.options[question.answer]; // save the correct answer text
    	const shuffled = this.#shuffle(question.options);  // shuffle the options
    	return {
        ...question,
        options: shuffled,
        answer: shuffled.indexOf(correct)  // find where correct answer landed
        };
    }

    init(questions) {
    	this.score = 0;
    	this.currentIndex = 0;
    	const shuffled = this.#shuffle(questions);
    	this.questions = shuffled.map(q => this.#shuffleOptions(q));
    }

    get totalQuestions() {
        return this.questions.length;
    }

    get questionNumber() {
        return this.currentIndex + 1;
    }

    get progress() {
        if (!this.questions.length) return 0;
        return (this.currentIndex / this.questions.length) * 100;
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    // choiceIndex is the index into question.options[]
    processAnswer(choiceIndex) {
        const question = this.getCurrentQuestion();
        const isCorrect = choiceIndex === question.answer;

        if (isCorrect) this.score += 10;

        const hasNext = this.currentIndex < this.questions.length - 1;
        if (hasNext) this.currentIndex++;

        return {
            isCorrect,
            hasNext,
            score: this.score,
            explanation: question.explanation ?? null
        };
    }
}
