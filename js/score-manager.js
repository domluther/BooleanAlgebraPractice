// score-manager.js - Refactored for clean architecture
export class ScoreManager {
    constructor(siteKey = 'boolean-algebra-practice') {
        this.siteKey = siteKey;
        this.storageKey = `gcse-cs-scores-${this.siteKey}`;
        this.scores = this.loadScores();
        
        // Duck-themed level system (points will vary by site)
        this.levels = [
            { threshold: 0, title: "Newcomer", emoji: "🥚", description: "Just hatched!" },
            { threshold: 10, title: "Duckling Logic", emoji: "🐣", description: "Taking your first waddle into logic gates!" },
            { threshold: 75, title: "Quack Calculator", emoji: "🐤", description: "Your Boolean expressions are starting to compute!" },
            { threshold: 200, title: "Duck Circuit Designer", emoji: "🦆", description: "Swimming confidently through truth tables!" },
            { threshold: 500, title: "Mallard Gate Master", emoji: "🦆✨", description: "Soaring above with elegant Boolean solutions!" },
            { threshold: 1000, title: "Golden Logic Goose", emoji: "🪿👑", description: "The legendary gate guru of the digital pond!" }
        ];
        
        // Mode-based scoring configuration
        this.modeScoring = {
            'nameThat': { basePoints: 1, difficultyMultiplier: 1 },
            'writeExpression': { basePoints: 3, difficultyMultiplier: 1.5 },
            'truthTable': { basePoints: 4, difficultyMultiplier: 2 },
            'drawCircuit': { basePoints: 3, difficultyMultiplier: 2.5 },
            'scenario': { basePoints: 3, difficultyMultiplier: 3 }
        };

        // Hardcoded scoring for specific modes by level
        this.modeScoringCalculated = {
            'nameThat': { 1: 1, 2: 2, 3: 4 },
            'writeExpression': { 1: 3, 2: 5, 3: 7, 4: 10, 5: 15},
            'truthTable': { 1: 4, 2: 8, 3: 12, 4: 20, 5: 25},
            'drawCircuit': { 1: 3, 2: 6, 3: 10, 4: 15, 5: 20},
            'scenario': { 1: 4, 2: 6, 3: 10, 4: 15}
        };
    }

    // === DATA LAYER (Pure data operations) ===
    
    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Error loading scores:', error);
            return {};
        }
    }

    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (error) {
            console.warn('Error saving scores:', error);
        }
    }

    calculatePoints(mode, difficulty, isCorrect) {
        if (!isCorrect) return 0;
        // return this.modeScoringCalculated[mode]?.[difficulty] || 1;        
        const config = this.modeScoring[mode] || { basePoints: 2, difficultyMultiplier: 1 };
        return Math.floor(config.basePoints * ((1 + (difficulty - 1)) * config.difficultyMultiplier));
    }

    lookupPoints(mode, difficulty, isCorrect) {
        if (!isCorrect) return 0;

        return this.modeScoringCalculated[mode][difficulty];
    }

    recordScore(mode, difficulty, isCorrect, expertMode = false) {
        // const points = this.calculatePoints(mode, difficulty, isCorrect);
        let points = this.lookupPoints(mode, difficulty, isCorrect);
        if (expertMode) {
            points *= 3
        }
        if (!this.scores[mode]) {
            this.scores[mode] = {
                attempts: 0,
                correct: 0,
                totalPoints: 0,
                bestStreak: 0,
                currentStreak: 0
            };
        }

        this.scores[mode].attempts++;
        
        if (isCorrect) {
            this.scores[mode].correct++;
            this.scores[mode].totalPoints += points;
            this.scores[mode].currentStreak++;
            if (this.scores[mode].currentStreak > this.scores[mode].bestStreak) {
                this.scores[mode].bestStreak = this.scores[mode].currentStreak;
            }
        } else {
            this.scores[mode].currentStreak = 0;
        }

        this.saveScores();
        return {
            points,
            totalPoints: this.getTotalPoints(),
            currentLevel: this.getCurrentLevel(),
            nextLevel: this.getNextLevel()
        };
    }


    // === STATISTICS CALCULATIONS ===
    
    getTotalPoints() {
        return Object.values(this.scores).reduce((total, score) => {
            return total + (score.totalPoints || 0);
        }, 0);
    }

    getAccuracy() {
        const totalAttempts = Object.values(this.scores).reduce((sum, score) => sum + score.attempts, 0);
        const totalCorrect = Object.values(this.scores).reduce((sum, score) => sum + score.correct, 0);
        
        if (totalAttempts === 0) return 0;
        return Math.round((totalCorrect / totalAttempts) * 100);
    }
    getCurrentLevel() {
        const points = this.getTotalPoints();
        let currentLevel = this.levels[0];
        
        for (const level of this.levels) {
            if (points >= level.threshold) {
                currentLevel = level;
            } else {
                break;
            }
        }
        
        return currentLevel;
    }

    getNextLevel() {
        const currentLevel = this.getCurrentLevel();
        const currentIndex = this.levels.indexOf(currentLevel);
        return currentIndex < this.levels.length - 1 ? this.levels[currentIndex + 1] : null;
    }

    getStatistics() {
        const totalPoints = this.getTotalPoints();
        const currentLevel = this.getCurrentLevel();
        const nextLevel = this.getNextLevel();
        
        const totalAttempts = Object.values(this.scores).reduce((sum, score) => sum + score.attempts, 0);
        const totalCorrect = Object.values(this.scores).reduce((sum, score) => sum + score.correct, 0);
        const accuracy = this.getAccuracy();
        
        return {
            totalAttempts,
            totalCorrect,
            totalPoints,
            accuracy,
            currentLevel,
            nextLevel,
            scores: this.scores,
            progressToNext: nextLevel ? {
                current: totalPoints,
                required: nextLevel.threshold,
                remaining: nextLevel.threshold - totalPoints,
                percentage: Math.min(100, (totalPoints / nextLevel.threshold) * 100)
            } : null
        };
    }

    resetAllScores() {
        this.scores = {};
        this.saveScores();
    }

    // formatModeName(mode) {
    //     const modeNames = {
    //         'nameThat': 'Name That Gate',
    //         'writeExpression': 'Write Expression', 
    //         'truthTable': 'Truth Table',
    //         'drawCircuit': 'Draw Circuit',
    //         'scenario': 'Scenario'
    //     };
    //     return modeNames[mode] || mode;
    // }
    // === UTILITY METHODS ===
    
    formatItemName(key) {
        return key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}