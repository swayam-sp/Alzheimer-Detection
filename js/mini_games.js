import { submitGameScore } from './api.js';

function formatTime(seconds) {
  if (!seconds) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

class MemoryMatchGame {
    constructor(container, bestTime = null) {
        this.container = container;
        this.bestTime = bestTime;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameActive = false;
        this.startTime = null;
        this.timer = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold mb-2">Memory Match</h3>
                <p class="text-slate-600">Match all pairs in the fewest moves possible!</p>
                <div class="flex justify-center gap-6 mt-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="moves">0</div>
                        <div class="text-sm text-slate-500">Moves</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="time">0</div>
                        <div class="text-sm text-slate-500">Seconds</div>
                    </div>
                </div>
            </div>
            <div id="game-board" class="grid grid-cols-4 gap-3 max-w-md mx-auto"></div>
            <div class="text-center mt-6">
                <button id="start-game" class="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    Start Game
                </button>
                <button id="end-game" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    End Game
                </button>
            </div>
            <div id="notification" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg hidden"></div>
        `;

        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
    }

    startGame() {
        this.gameActive = true;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            document.getElementById('time').textContent = Math.floor((Date.now() - this.startTime) / 1000);
        }, 1000);

        document.getElementById('moves').textContent = '0';
        document.getElementById('time').textContent = '0';
        document.getElementById('start-game').classList.add('hidden');
        document.getElementById('end-game').classList.remove('hidden');

        this.createBoard();
    }

    createBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';

        // Create pairs of cards with symbols
        const symbols = ['🧠', '💭', '🎯', '⚡', '🌟', '🔍', '📚', '🎨'];
        const cardValues = [...symbols, ...symbols]; // Duplicate for pairs

        // Shuffle cards
        for (let i = cardValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
        }

        cardValues.forEach((value, index) => {
            const card = document.createElement('div');
            card.className = 'aspect-square bg-violet-600 rounded-lg cursor-pointer flex items-center justify-center text-2xl font-bold text-white transition-transform hover:scale-105';
            card.dataset.value = value;
            card.dataset.index = index;
            card.addEventListener('click', () => this.flipCard(card));
            board.appendChild(card);
            this.cards.push(card);
        });
    }

    flipCard(card) {
        if (!this.gameActive || this.flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        card.classList.add('flipped');
        card.textContent = card.dataset.value;
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('moves').textContent = this.moves;

            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;

        if (card1.dataset.value === card2.dataset.value) {
            // Match found
            card1.classList.add('matched', 'bg-green-500');
            card2.classList.add('matched', 'bg-green-500');
            this.matchedPairs++;

            if (this.matchedPairs === 8) {
                this.endGame(true);
            }
        } else {
            // No match
            card1.classList.remove('flipped');
            card1.textContent = '';
            card2.classList.remove('flipped');
            card2.textContent = '';
        }

        this.flippedCards = [];
    }

    endGame(completed = false) {
        this.gameActive = false;
        clearInterval(this.timer);

        document.getElementById('start-game').classList.remove('hidden');
        document.getElementById('end-game').classList.add('hidden');

        const time = Math.floor((Date.now() - this.startTime) / 1000);

        if (completed) {
            const score = Math.max(1000 - (this.moves * 10) - (time * 2), 100); // Higher score for fewer moves and faster time

            // Submit score with time
            submitGameScore('memory_match', score, time).then(result => {
                const isNewBest = result.isNewBest;
                console.log('Score submitted:', score, 'Time:', time, 'Is new best:', isNewBest);
                this.bestTime = result.bestTime;
                const bestTime = result.bestTime;
                const bestDisplay = formatTime(bestTime);
                document.getElementById('best-score').textContent = bestDisplay;
                // Show notification
                const notification = document.getElementById('notification');
                const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
                notification.textContent = `Congratulations! You completed the game in ${this.moves} moves and ${time} seconds. Score: ${score} (Best: ${bestDisplay})${bestText}`;
                notification.classList.remove('hidden');
                if (isNewBest) {
                    notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                    setTimeout(() => notification.classList.add('hidden'), 7000); // Longer display for new best
                } else {
                    setTimeout(() => notification.classList.add('hidden'), 5000);
                }
            }).catch(error => {
                console.error('Failed to submit score:', error);
            });
        } else {
            // Show notification for incomplete game
            const notification = document.getElementById('notification');
            notification.textContent = `Game ended. You made ${this.moves} moves in ${time} seconds.`;
            notification.classList.remove('hidden');
            notification.classList.remove('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
            notification.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
            setTimeout(() => notification.classList.add('hidden'), 5000);
        }
    }
}

class SequenceRecallGame {
    constructor(container, bestTime = null, bestScore = null) {
        this.container = container;
        this.bestTime = bestTime;
        this.bestScore = bestScore;
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.gameActive = false;
        this.showingSequence = false;
        this.startTime = null;
        this.displaySpeed = 1000; // Initial speed: 1000ms highlight, 600ms pause
    }

    init() {
        this.container.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold mb-2">Sequence Recall</h3>
                <p class="text-slate-600">Watch the sequence and repeat it back!</p>
                <div class="flex justify-center gap-6 mt-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="level">1</div>
                        <div class="text-sm text-slate-500">Level</div>
                    </div>
                </div>
            </div>
            <div id="sequence-board" class="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6"></div>
            <div id="sequence-table" class="text-center mb-6">
                <h4 class="text-lg font-semibold mb-2">Your Sequence:</h4>
                <table class="mx-auto border-collapse border border-slate-300">
                    <tbody id="sequence-tbody" class="text-xl font-bold text-violet-600"></tbody>
                </table>
            </div>
            <div class="text-center">
                <button id="start-sequence" class="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    Start Game
                </button>
                <button id="end-sequence" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    End Game
                </button>
            </div>
            <div id="notification" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg hidden"></div>
        `;

        this.createBoard();
        document.getElementById('start-sequence').addEventListener('click', () => this.startGame());
        document.getElementById('end-sequence').addEventListener('click', () => this.endGame());
    }

    createBoard() {
        const board = document.getElementById('sequence-board');
        board.innerHTML = '';

        for (let i = 1; i <= 9; i++) {
            const button = document.createElement('button');
            button.className = 'aspect-square bg-slate-200 rounded-lg text-2xl font-bold hover:bg-slate-300 transition-colors';
            button.textContent = i;
            button.dataset.number = i;
            button.addEventListener('click', () => this.handleClick(i));
            board.appendChild(button);
        }
    }

    startGame() {
        this.level = 1;
        this.gameActive = true;
        this.sequence = [];
        this.playerSequence = [];
        this.startTime = Date.now();

        document.getElementById('level').textContent = '1';
        document.getElementById('sequence-tbody').innerHTML = '';
        document.getElementById('start-sequence').classList.add('hidden');
        document.getElementById('end-sequence').classList.remove('hidden');

        this.generateSequence();
        this.showSequence();
    }

    generateSequence() {
        this.sequence = [];
        for (let i = 0; i < this.level + 2; i++) {
            this.sequence.push(Math.floor(Math.random() * 9) + 1);
        }
    }

    async showSequence() {
        this.showingSequence = true;
        const buttons = document.querySelectorAll('#sequence-board button');

        for (const num of this.sequence) {
            await new Promise(resolve => setTimeout(resolve, this.displaySpeed));
            const button = Array.from(buttons).find(btn => btn.dataset.number == num);
            button.classList.add('bg-violet-600', 'text-white');
            await new Promise(resolve => setTimeout(resolve, 400));
            button.classList.remove('bg-violet-600', 'text-white');
        }

        this.showingSequence = false;
    }

    handleClick(number) {
        if (!this.gameActive || this.showingSequence) return;

        this.playerSequence.push(number);

        // Display the pressed digit in the sequence table
        const tbody = document.getElementById('sequence-tbody');
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = number;
        tr.appendChild(td);
        tbody.appendChild(tr);

        // Check if sequence is correct so far
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.endGame(false);
            return;
        }

        // Check if sequence is complete
        if (this.playerSequence.length === this.sequence.length) {
            this.level++;
            document.getElementById('level').textContent = this.level;
            this.playerSequence = [];
            document.getElementById('sequence-tbody').innerHTML = ''; // Clear the sequence table for the next level
            setTimeout(() => {
                this.generateSequence();
                this.showSequence();
            }, 1000);
        }
    }

    endGame(completed = false) {
        this.gameActive = false;

        document.getElementById('start-sequence').classList.remove('hidden');
        document.getElementById('end-sequence').classList.add('hidden');

        const score = completed ? this.level * 100 : (this.level - 1) * 100;
        const time = Math.floor((Date.now() - this.startTime) / 1000);

        submitGameScore('sequence_recall', score, time).then(result => {
            const isNewBest = result.isNewBest;
            this.bestScore = result.bestScore;
            const bestTime = result.bestTime;
            // Show notification
            const notification = document.getElementById('notification');
            const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
            const message = completed
                ? `Game Over! You reached level ${this.level}. Score: ${score}${bestText}`
                : `Game Over! You reached level ${this.level}. Final score: ${score}${bestText}`;
            notification.textContent = message;
            notification.classList.remove('hidden');
            if (isNewBest) {
                notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                setTimeout(() => notification.classList.add('hidden'), 7000);
            } else {
                setTimeout(() => notification.classList.add('hidden'), 5000);
            }
        }).catch(console.error);
    }
}

class PatternRecognitionGame {
    constructor(container, bestTime = null) {
        this.container = container;
        this.bestTime = bestTime;
        this.pattern = [];
        this.options = [];
        this.level = 1;
        this.gameActive = false;
        this.startTime = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold mb-2">Pattern Recognition</h3>
                <p class="text-slate-600">Complete the pattern!</p>
                <div class="flex justify-center gap-6 mt-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="pattern-level">1</div>
                        <div class="text-sm text-slate-500">Level</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="pattern-best-score">${formatTime(this.bestTime)}</div>
                        <div class="text-sm text-slate-500">Best Time</div>
                    </div>
                </div>
            </div>
            <div id="pattern-display" class="flex justify-center gap-2 mb-6"></div>
            <div id="pattern-options" class="grid grid-cols-4 gap-2 max-w-sm mx-auto"></div>
            <div class="text-center mt-6">
                <button id="start-pattern" class="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    Start Game
                </button>
                <button id="end-pattern" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    End Game
                </button>
            </div>
            <div id="notification" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg hidden"></div>
        `;

        document.getElementById('start-pattern').addEventListener('click', () => this.startGame());
        document.getElementById('end-pattern').addEventListener('click', () => this.endGame());
    }

    startGame() {
        this.level = 1;
        this.gameActive = true;
        this.startTime = Date.now();

        document.getElementById('pattern-level').textContent = '1';
        document.getElementById('start-pattern').classList.add('hidden');
        document.getElementById('end-pattern').classList.remove('hidden');

        this.generatePattern();
    }

    generatePattern() {
        // Generate various patterns for recognition
        const patternTypes = ['increasing', 'decreasing', 'alternating', 'fibonacci', 'primes', 'squares', 'evens', 'odds', 'geometric'];
        const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];

        this.pattern = [];
        const length = Math.min(4 + this.level, 10); // Increased max length for more challenge

        if (type === 'increasing') {
            for (let i = 1; i <= length; i++) {
                this.pattern.push(i);
            }
        } else if (type === 'decreasing') {
            for (let i = length; i >= 1; i--) {
                this.pattern.push(i);
            }
        } else if (type === 'alternating') {
            const shapes = ['●', '■', '▲', '◆'];
            for (let i = 0; i < length; i++) {
                this.pattern.push(shapes[i % shapes.length]);
            }
        } else if (type === 'fibonacci') {
            let a = 1, b = 1;
            this.pattern.push(a);
            if (length > 1) this.pattern.push(b);
            for (let i = 2; i < length; i++) {
                const next = a + b;
                this.pattern.push(next);
                a = b;
                b = next;
            }
        } else if (type === 'primes') {
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
            for (let i = 0; i < length && i < primes.length; i++) {
                this.pattern.push(primes[i]);
            }
        } else if (type === 'squares') {
            for (let i = 1; i <= length; i++) {
                this.pattern.push(i * i);
            }
        } else if (type === 'evens') {
            for (let i = 1; i <= length; i++) {
                this.pattern.push(i * 2);
            }
        } else if (type === 'odds') {
            for (let i = 1; i <= length; i++) {
                this.pattern.push((i * 2) - 1);
            }
        } else if (type === 'geometric') {
            let value = 1;
            for (let i = 0; i < length; i++) {
                this.pattern.push(value);
                value *= 2;
            }
        }

        this.displayPattern();
        this.generateOptions();
    }

    displayPattern() {
        const display = document.getElementById('pattern-display');
        display.innerHTML = '';

        // Show pattern with one missing
        const missingIndex = Math.floor(Math.random() * this.pattern.length);
        this.correctAnswer = this.pattern[missingIndex];

        this.pattern.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-xl font-bold';

            if (index === missingIndex) {
                element.textContent = '?';
                element.classList.add('bg-violet-200');
            } else {
                element.textContent = item;
            }

            display.appendChild(element);
        });
    }

    generateOptions() {
        const optionsContainer = document.getElementById('pattern-options');
        optionsContainer.innerHTML = '';

        this.options = [this.correctAnswer];

        // Add 3 incorrect options
        const allPossible = this.pattern.filter(item => item !== this.correctAnswer);
        while (this.options.length < 4 && allPossible.length > 0) {
            const randomItem = allPossible.splice(Math.floor(Math.random() * allPossible.length), 1)[0];
            if (!this.options.includes(randomItem)) {
                this.options.push(randomItem);
            }
        }

        // Shuffle options
        for (let i = this.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.options[i], this.options[j]] = [this.options[j], this.options[i]];
        }

        this.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'aspect-square bg-slate-200 rounded-lg text-xl font-bold hover:bg-slate-300 transition-colors';
            button.textContent = option;
            button.addEventListener('click', () => this.checkAnswer(option));
            optionsContainer.appendChild(button);
        });
    }

    checkAnswer(selected) {
        if (!this.gameActive) return;

        if (selected === this.correctAnswer) {
            this.level++;
            document.getElementById('pattern-level').textContent = this.level;
            setTimeout(() => this.generatePattern(), 1000);
        } else {
            this.endGame(false);
        }
    }

    endGame(completed = false) {
        this.gameActive = false;

        document.getElementById('start-pattern').classList.remove('hidden');
        document.getElementById('end-pattern').classList.add('hidden');

        const score = this.level * 50;
        const time = Math.floor((Date.now() - this.startTime) / 1000);

        if (completed) {
            submitGameScore('pattern_recognition', score, time).then(result => {
                const isNewBest = result.isNewBest;
                this.bestTime = result.bestTime;
                document.getElementById('pattern-best-score').textContent = formatTime(this.bestTime);
                // Show notification
                const notification = document.getElementById('notification');
                const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
                notification.textContent = `Game Over! You reached level ${this.level}. Score: ${score} (Best: ${formatTime(this.bestTime)})${bestText}`;
                notification.classList.remove('hidden');
                if (isNewBest) {
                    notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                    setTimeout(() => notification.classList.add('hidden'), 7000);
                } else {
                    setTimeout(() => notification.classList.add('hidden'), 5000);
                }
            }).catch(console.error);
        } else {
            // Submit score for incomplete game to update best time if applicable
            submitGameScore('pattern_recognition', score, time).then(result => {
                const isNewBest = result.isNewBest;
                this.bestTime = result.bestTime;
                document.getElementById('pattern-best-score').textContent = formatTime(this.bestTime);
                // Show notification for incomplete game
                const notification = document.getElementById('notification');
                const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
                notification.textContent = `Incorrect! You reached level ${this.level}. Final score: ${score} (Best: ${formatTime(this.bestTime)})${bestText}`;
                notification.classList.remove('hidden');
                if (isNewBest) {
                    notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                    setTimeout(() => notification.classList.add('hidden'), 7000);
                } else {
                    notification.classList.remove('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                    notification.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
                    setTimeout(() => notification.classList.add('hidden'), 5000);
                }
            }).catch(console.error);
        }
    }
}

class SlidingPuzzleGame {
    constructor(container, bestScore = null) {
        this.container = container;
        this.bestScore = bestScore;
        this.gridSize = 3; // 3x3 grid
        this.tiles = [];
        this.emptyPos = { row: 2, col: 2 };
        this.moves = 0;
        this.gameActive = false;
        this.startTime = null;
        this.timer = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold mb-2">Sliding Puzzle</h3>
                <p class="text-slate-600">Slide tiles to arrange numbers in order!</p>
                <div class="flex justify-center gap-6 mt-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="puzzle-moves">0</div>
                        <div class="text-sm text-slate-500">Moves</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="puzzle-time">0</div>
                        <div class="text-sm text-slate-500">Seconds</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="puzzle-best-score">${formatTime(this.bestScore)}</div>
                        <div class="text-sm text-slate-500">Best Time</div>
                    </div>
                </div>
            </div>
            <div id="puzzle-grid" class="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6"></div>
            <div class="text-center">
                <button id="start-puzzle" class="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    Start Game
                </button>
                <button id="shuffle-puzzle" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    Shuffle
                </button>
                <button id="end-puzzle" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    End Game
                </button>
            </div>
            <div id="notification" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg hidden"></div>
        `;

        document.getElementById('start-puzzle').addEventListener('click', () => this.startGame());
        document.getElementById('shuffle-puzzle').addEventListener('click', () => this.shuffleTiles());
        document.getElementById('end-puzzle').addEventListener('click', () => this.endGame());
    }

    startGame() {
        this.gameActive = true;
        this.moves = 0;
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            document.getElementById('puzzle-time').textContent = Math.floor((Date.now() - this.startTime) / 1000);
        }, 1000);

        document.getElementById('puzzle-moves').textContent = '0';
        document.getElementById('puzzle-time').textContent = '0';
        document.getElementById('start-puzzle').classList.add('hidden');
        document.getElementById('shuffle-puzzle').classList.remove('hidden');
        document.getElementById('end-puzzle').classList.remove('hidden');

        this.createGrid();
        this.shuffleTiles();
    }

    createGrid() {
        const grid = document.getElementById('puzzle-grid');
        grid.innerHTML = '';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = document.createElement('div');
                const tileNumber = row * this.gridSize + col + 1;

                if (tileNumber === 9) { // Empty tile
                    tile.className = 'aspect-square bg-slate-200 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer border-2 border-dashed border-slate-300';
                    tile.textContent = '';
                    tile.dataset.empty = 'true';
                } else {
                    tile.className = 'aspect-square bg-violet-600 text-white rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer hover:bg-violet-700 transition-colors';
                    tile.textContent = tileNumber;
                }

                tile.dataset.row = row;
                tile.dataset.col = col;
                tile.addEventListener('click', () => this.moveTile(row, col));
                grid.appendChild(tile);
                this.tiles.push(tile);
            }
        }
    }

    shuffleTiles() {
        // Perform random valid moves to shuffle
        for (let i = 0; i < 100; i++) {
            const validMoves = this.getValidMoves();
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.performMove(randomMove.row, randomMove.col, false);
            }
        }
    }

    moveTile(row, col) {
        if (!this.gameActive) return;

        const tile = this.tiles[row * this.gridSize + col];
        if (tile.dataset.empty === 'true') return;

        // Check if move is valid (adjacent to empty space)
        const rowDiff = Math.abs(row - this.emptyPos.row);
        const colDiff = Math.abs(col - this.emptyPos.col);

        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            this.performMove(row, col, true);
        }
    }

    performMove(row, col, countAsMove = true) {
        const tile = this.tiles[row * this.gridSize + col];
        const emptyTile = this.tiles[this.emptyPos.row * this.gridSize + this.emptyPos.col];

        // Swap content and styles
        const tempContent = tile.textContent;
        const tempClass = tile.className;

        tile.textContent = emptyTile.textContent;
        tile.className = emptyTile.className;
        tile.dataset.empty = 'true';

        emptyTile.textContent = tempContent;
        emptyTile.className = tempClass;
        delete emptyTile.dataset.empty;

        // Update empty position
        this.emptyPos = { row, col };

        if (countAsMove) {
            this.moves++;
            document.getElementById('puzzle-moves').textContent = this.moves;

            if (this.checkWin()) {
                this.endGame(true);
            }
        }
    }

    getValidMoves() {
        const validMoves = [];
        const { row, col } = this.emptyPos;

        // Check all four directions
        const directions = [
            { row: row - 1, col }, // up
            { row: row + 1, col }, // down
            { row, col: col - 1 }, // left
            { row, col: col + 1 }  // right
        ];

        for (const dir of directions) {
            if (dir.row >= 0 && dir.row < this.gridSize && dir.col >= 0 && dir.col < this.gridSize) {
                validMoves.push(dir);
            }
        }

        return validMoves;
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            const expectedNumber = i + 1;
            if (parseInt(this.tiles[i].textContent) !== expectedNumber) {
                return false;
            }
        }
        return true;
    }

    endGame(completed = false) {
        this.gameActive = false;
        clearInterval(this.timer);

        document.getElementById('start-puzzle').classList.remove('hidden');
        document.getElementById('shuffle-puzzle').classList.add('hidden');
        document.getElementById('end-puzzle').classList.add('hidden');

        const time = Math.floor((Date.now() - this.startTime) / 1000);

        if (completed) {
            const score = Math.max(1000 - (this.moves * 5) - (time * 2), 100); // Higher score for fewer moves and faster time

            // Submit score with time
            submitGameScore('sliding_puzzle', score, time).then(result => {
                const isNewBest = result.isNewBest;
                console.log('Score submitted:', score, 'Time:', time, 'Is new best:', isNewBest);
                this.bestScore = result.bestScore;
                const bestTime = result.bestTime;
                const bestDisplay = formatTime(bestTime);
                document.getElementById('puzzle-best-score').textContent = bestDisplay;
                // Show notification
                const notification = document.getElementById('notification');
                const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
                notification.textContent = `Congratulations! You solved the puzzle in ${this.moves} moves and ${time} seconds. Score: ${score} (Best: ${bestDisplay})${bestText}`;
                notification.classList.remove('hidden');
                if (isNewBest) {
                    notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                    setTimeout(() => notification.classList.add('hidden'), 7000);
                } else {
                    setTimeout(() => notification.classList.add('hidden'), 5000);
                }
            }).catch(error => {
                console.error('Failed to submit score:', error);
            });
        } else {
            // Show notification for incomplete game
            const notification = document.getElementById('notification');
            notification.textContent = `Game ended. You made ${this.moves} moves in ${time} seconds.`;
            notification.classList.remove('hidden');
            notification.classList.remove('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
            notification.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
            setTimeout(() => notification.classList.add('hidden'), 5000);
        }
    }
}

class MemoryRunGame {
    constructor(container, bestScore = null) {
        this.container = container;
        this.bestScore = bestScore;
        this.sequence = [];
        this.currentStep = 0;
        this.level = 1;
        this.gameActive = false;
        this.showingSequence = false;
        this.startTime = null;
        this.timer = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold mb-2">Memory Run Doors</h3>
                <p class="text-slate-600">Memorize the sequence and choose the correct doors!</p>
                <div class="flex justify-center gap-6 mt-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="run-level">1</div>
                        <div class="text-sm text-slate-500">Level</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-violet-600" id="run-time">0</div>
                        <div class="text-sm text-slate-500">Seconds</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="run-best-score">${formatTime(this.bestScore)}</div>
                        <div class="text-sm text-slate-500">Best Time</div>
                    </div>
                </div>
            </div>
            <div id="sequence-display" class="text-center mb-6 text-3xl font-bold text-violet-600"></div>
            <div id="wall-display" class="text-center mb-6 hidden">
                <div class="text-lg font-semibold mb-4">Choose the door for step ${this.currentStep + 1}:</div>
                <div class="flex justify-center gap-4">
                    <button id="door-1" class="px-8 py-4 bg-slate-200 text-2xl font-bold rounded-lg hover:bg-slate-300 transition-colors">1</button>
                    <button id="door-2" class="px-8 py-4 bg-slate-200 text-2xl font-bold rounded-lg hover:bg-slate-300 transition-colors">2</button>
                    <button id="door-3" class="px-8 py-4 bg-slate-200 text-2xl font-bold rounded-lg hover:bg-slate-300 transition-colors">3</button>
                </div>
            </div>
            <div class="text-center">
                <button id="start-run" class="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    Start Game
                </button>
                <button id="end-run" class="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors ml-4 hidden">
                    End Game
                </button>
            </div>
            <div id="notification" class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg hidden"></div>
        `;

        document.getElementById('start-run').addEventListener('click', () => this.startGame());
        document.getElementById('end-run').addEventListener('click', () => this.endGame());
        document.getElementById('door-1').addEventListener('click', () => this.chooseDoor(1));
        document.getElementById('door-2').addEventListener('click', () => this.chooseDoor(2));
        document.getElementById('door-3').addEventListener('click', () => this.chooseDoor(3));
    }

    startGame() {
        this.level = 1;
        this.gameActive = true;
        this.sequence = [];
        this.currentStep = 0;
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            document.getElementById('run-time').textContent = Math.floor((Date.now() - this.startTime) / 1000);
        }, 1000);

        document.getElementById('run-level').textContent = '1';
        document.getElementById('run-time').textContent = '0';
        document.getElementById('start-run').classList.add('hidden');
        document.getElementById('end-run').classList.remove('hidden');

        this.generateSequence();
        this.showSequence();
    }

    generateSequence() {
        this.sequence = [];
        const length = 2 + this.level; // Start with 3, increase by 1 each level
        for (let i = 0; i < length; i++) {
            this.sequence.push(Math.floor(Math.random() * 3) + 1);
        }
    }

    async showSequence() {
        this.showingSequence = true;
        const display = document.getElementById('sequence-display');
        display.classList.remove('hidden');
        document.getElementById('wall-display').classList.add('hidden');

        display.textContent = this.sequence.join(' → ');

        // Show for 3-5 seconds based on length
        const showTime = Math.min(3000 + (this.sequence.length * 200), 5000);
        await new Promise(resolve => setTimeout(resolve, showTime));

        display.classList.add('hidden');
        this.showingSequence = false;
        this.presentWall();
    }

    presentWall() {
        document.getElementById('wall-display').classList.remove('hidden');
        document.getElementById('wall-display').querySelector('div').textContent = `Choose the door for step ${this.currentStep + 1}:`;
    }

    chooseDoor(choice) {
        if (!this.gameActive || this.showingSequence) return;

        if (choice === this.sequence[this.currentStep]) {
            this.currentStep++;
            if (this.currentStep >= this.sequence.length) {
                // Completed sequence
                this.level++;
                document.getElementById('run-level').textContent = this.level;
                this.currentStep = 0;
                setTimeout(() => {
                    this.generateSequence();
                    this.showSequence();
                }, 1000);
            } else {
                // Next step
                this.presentWall();
            }
        } else {
            // Wrong choice
            this.endGame(false);
        }
    }

    endGame(completed = false) {
        this.gameActive = false;
        clearInterval(this.timer);

        document.getElementById('start-run').classList.remove('hidden');
        document.getElementById('end-run').classList.add('hidden');
        document.getElementById('wall-display').classList.add('hidden');

        const time = Math.floor((Date.now() - this.startTime) / 1000);
        const score = (this.level - 1) * 100 + Math.max(0, 100 - time); // Base score per level + speed bonus

        submitGameScore('memory_run_doors', score, time).then(result => {
            const isNewBest = result.isNewBest;
            this.bestScore = result.bestScore;
            const bestTime = result.bestTime;
            document.getElementById('run-best-score').textContent = formatTime(bestTime);
            // Show notification
            const notification = document.getElementById('notification');
            const bestText = isNewBest ? ' 🏆 New Personal Best!' : '';
            const message = completed
                ? `Game Over! You reached level ${this.level}. Score: ${score} (Best: ${formatTime(bestTime)})${bestText}`
                : `Wrong door! You reached level ${this.level}. Final score: ${score} (Best: ${formatTime(bestTime)})${bestText}`;
            notification.textContent = message;
            notification.classList.remove('hidden');
            if (isNewBest) {
                notification.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-700');
                setTimeout(() => notification.classList.add('hidden'), 7000);
            } else {
                setTimeout(() => notification.classList.add('hidden'), 5000);
            }
        }).catch(console.error);
    }
}

// Export game classes
export { MemoryMatchGame, SequenceRecallGame, PatternRecognitionGame, SlidingPuzzleGame, MemoryRunGame };
