const PHRASES = [
    // Adventure Heroes
    'The hero swings between tall buildings!',
    'A brave knight saves the kingdom!',
    'Lightning flashes as the wizard appears!',
    'The mighty warrior defeats the dragon!',
    'A mysterious hero protects the city!',
    'The masked champion fights for justice.',
    
    // Video Game Themes
    'Jump over the dangerous obstacles!',
    'Race through the glowing rings!',
    'Build a castle in the sandbox world.',
    'Collect all the shiny gold coins!',
    'The wizard casts a powerful spell!',
    'Explore the spooky haunted mansion.',
    
    // Fun Gaming Phrases
    'Press start to begin your quest!',
    'Power up with magical abilities!',
    'Find the hidden treasure chest!',
    'The final boss appears ahead!',
    'A new adventure awaits you!',
    'Level up and become stronger!'
];

class RetroTyper {
    constructor() {
        this.score = 0;
        this.currentPhrase = '';
        this.startTime = null;
        this.gameStarted = false;
        
        // Load high scores first
        this.highScores = this.loadHighScores();

        // Initialize DOM Elements with error checking
        this.initializeElements();

        // Bind event listeners
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.startGame());
            
            // Add keyboard listener for Enter key to start game
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.startButton.style.display !== 'none') {
                    this.startGame();
                }
            });
        }
        
        if (this.wordInput) {
            this.wordInput.addEventListener('input', (e) => this.checkInput(e));
        }

        // Initialize displays
        this.updateDisplay();  // Add this to show high score on load
        this.displayHighScores();
    }

    initializeElements() {
        this.phraseDisplay = document.getElementById('word');
        this.wordInput = document.getElementById('word-input');
        this.scoreDisplay = document.getElementById('current-score');
        this.timerDisplay = document.getElementById('timer');
        this.gameOverDisplay = document.getElementById('game-over');
        this.highScoreDisplay = document.getElementById('score-display');
        this.startButton = document.getElementById('start-button');
        this.gameUI = document.getElementById('game-ui');
        this.leaderboardDisplay = document.getElementById('leaderboard');
        this.initialsInput = document.getElementById('initials-input');
        this.initialsUI = document.getElementById('initials-ui');
    }

    loadHighScores() {
        const scores = localStorage.getItem('highScores');
        // When loading from storage, we don't want any scores marked as new
        return scores ? JSON.parse(scores).map(score => ({
            ...score,
            id: score.id,
            isNew: false
        })) : [];
    }

    saveHighScores() {
        // When saving to storage, we don't want to save the 'isNew' flag
        const scoresForStorage = this.highScores.map(score => ({
            initials: score.initials,
            score: score.score,
            id: score.id
        }));
        localStorage.setItem('highScores', JSON.stringify(scoresForStorage));
    }

    displayHighScores() {
        if (!this.leaderboardDisplay) return;
        
        const scoresList = this.highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((score, index) => {
                const isNewScore = score.isNew || false;
                return `<div class="score-entry ${isNewScore ? 'new-score' : ''}">
                    <span class="rank">${index + 1}.</span>
                    <span class="initials">${score.initials}</span>
                    <span class="score-value">${score.score}</span>
                </div>`;
            })
            .join('');

        this.leaderboardDisplay.innerHTML = `
            <h2>TOP SCORES</h2>
            <div class="scores-list">
                ${scoresList || '<div class="no-scores">No scores yet!</div>'}
            </div>
        `;

        // Clear the 'new' flag after displaying
        this.highScores = this.highScores.map(score => ({
            ...score,
            isNew: false
        }));
    }

    checkHighScore(score) {
        return this.highScores.length < 10 || score > this.highScores[this.highScores.length - 1]?.score;
    }

    addHighScore(initials, score) {
        const newScoreId = Date.now();
        // Mark this score as new when adding it
        this.highScores.push({ 
            initials, 
            score, 
            id: newScoreId,
            isNew: true 
        });
        this.highScores.sort((a, b) => b.score - a.score);
        if (this.highScores.length > 10) {
            this.highScores.pop();
        }
        this.saveHighScores();
        this.displayHighScores();
    }

    playSound(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'success':
                oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'wrong':
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'levelup':
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    }

    getRandomPhrase() {
        return PHRASES[Math.floor(Math.random() * PHRASES.length)];
    }

    calculateScore(timeInSeconds, accuracy) {
        // Base score for perfect accuracy remains 1000
        let baseScore = 1000 * accuracy;
        
        // Remove speed multiplier cap - faster typing = higher scores
        // Using a curve that grows more gradually as speed increases
        // 15 seconds is now the "par" time (1x multiplier)
        let speedMultiplier = Math.pow(15 / timeInSeconds, 1.5);
        
        // Add length bonus - longer phrases are worth more
        // Each character over 20 adds 5% to the multiplier
        let lengthMultiplier = 1 + Math.max(0, (this.currentPhrase.length - 20) * 0.05);
        
        // Calculate final score with all multipliers
        return Math.round(baseScore * speedMultiplier * lengthMultiplier);
    }

    updateDisplay() {
        if (this.scoreDisplay) this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        if (this.highScoreDisplay) this.highScoreDisplay.textContent = `HIGH SCORE: ${Math.max(...this.highScores.map(s => s.score), 0)}`;
    }

    startGame() {
        this.gameStarted = true;
        this.score = 0;
        this.currentPhrase = this.getRandomPhrase();
        this.startTime = new Date();
        
        this.startButton.style.display = 'none';
        this.leaderboardDisplay.style.display = 'none';
        this.gameUI.style.display = 'block';
        if (this.initialsUI) this.initialsUI.style.display = 'none';
        
        // Initialize with all characters as untyped
        let initialPhrase = '';
        for (let i = 0; i < this.currentPhrase.length; i++) {
            initialPhrase += `<span class="untyped">${this.currentPhrase[i]}</span>`;
        }
        this.phraseDisplay.innerHTML = initialPhrase;
        
        this.wordInput.value = '';
        this.wordInput.disabled = false;
        this.wordInput.focus();
        this.timerDisplay.textContent = 'Type the phrase!';
        
        this.updateDisplay();
    }

    showInitialsInput(score) {
        this.gameUI.style.display = 'none';
        this.initialsUI.style.display = 'block';
        this.initialsInput.value = '';
        this.initialsInput.maxLength = 3;
        this.initialsInput.focus();
        
        const submitInitials = () => {
            let initials = this.initialsInput.value.toUpperCase();
            if (initials.length > 0) {
                this.addHighScore(initials, score);
                this.initialsUI.style.display = 'none';
                this.startButton.style.display = 'block';
                this.leaderboardDisplay.style.display = 'block';
                this.startButton.textContent = 'PLAY AGAIN!';
            }
        };

        this.initialsInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                submitInitials();
            }
        };

        document.getElementById('submit-initials').onclick = submitInitials;
    }

    checkInput(e) {
        const input = e.target.value;
        const currentLength = input.length;
        const targetLength = this.currentPhrase.length;
        
        // Create highlighted version of the phrase
        let highlightedPhrase = '';
        for (let i = 0; i < targetLength; i++) {
            if (i < currentLength) {
                // Character has been typed
                if (input[i] === this.currentPhrase[i]) {
                    highlightedPhrase += `<span class="correct">${this.currentPhrase[i]}</span>`;
                } else {
                    highlightedPhrase += `<span class="wrong">${this.currentPhrase[i]}</span>`;
                }
            } else {
                // Character hasn't been typed yet
                highlightedPhrase += `<span class="untyped">${this.currentPhrase[i]}</span>`;
            }
        }
        
        // Update the display with highlighted text
        this.phraseDisplay.innerHTML = highlightedPhrase;
        
        if (input === this.currentPhrase) {
            const timeElapsed = (new Date() - this.startTime) / 1000;
            
            let correctChars = 0;
            for (let i = 0; i < targetLength; i++) {
                if (input[i] === this.currentPhrase[i]) correctChars++;
            }
            const accuracy = correctChars / targetLength;
            
            const phraseScore = this.calculateScore(timeElapsed, accuracy);
            this.score = phraseScore;
            
            this.playSound('success');
            this.updateDisplay();
            
            // Show simple victory message with score
            this.timerDisplay.innerHTML = `AMAZING! YOU SCORED ${phraseScore} POINTS!`;
            this.wordInput.disabled = true;
            
            // Reset the phrase display to normal on completion
            this.phraseDisplay.innerHTML = `<span class="complete">${this.currentPhrase}</span>`;
            
            if (this.checkHighScore(phraseScore)) {
                setTimeout(() => {
                    this.showInitialsInput(phraseScore);
                }, 3000);
            } else {
                setTimeout(() => {
                    this.gameUI.style.display = 'none';
                    this.startButton.style.display = 'block';
                    this.leaderboardDisplay.style.display = 'block';
                    this.startButton.textContent = 'PLAY AGAIN!';
                }, 4000);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RetroTyper();
}); 