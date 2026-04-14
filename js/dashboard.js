import { getTestHistory, getTotalTests, getUserGames, getBestScores } from './api.js';
import { supabase } from './supabase.js';
import { createTestHistoryCard, createMiniGameCard, createGamePerformanceCard, generatePDFReportFromData } from './ui_components.js';
import { initChatbot } from './chatbot.js';
import { MemoryMatchGame, SequenceRecallGame, PatternRecognitionGame, SlidingPuzzleGame, MemoryRunGame } from './mini_games.js';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const historyContainer = document.getElementById('test-history-container');
    const loadingEl = document.getElementById('loading-history');
    const noHistoryEl = document.getElementById('no-history');
    const mmseChartCanvas = document.getElementById('mmse-chart');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTestsCountEl = document.getElementById('total-tests-count');


    const gamesContainer = document.getElementById('games-container');
    let bestScores = {};
    let userGames = [];

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    let chartInstance = null;

    const renderChart = (history) => {
        if (chartInstance) {
            chartInstance.destroy();
        }

        const labels = history.map(item => new Date(item.created_at).toLocaleDateString()).reverse();
        const data = history.map(item => item.mmse_score).reverse();

        const ctx = mmseChartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'MMSE Score',
                    data: data,
                    fill: true,
                    borderColor: 'rgb(124, 58, 237)',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgb(124, 58, 237)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(124, 58, 237)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        max: 30,
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    };

    const loadHistory = async () => {
        try {
            const history = await getTestHistory();
            loadingEl.style.display = 'none';

            if (history && history.length > 0) {
                history.forEach(item => {
                    const card = createTestHistoryCard(item, (testData) => {
                        generatePDFReportFromData(testData);
                    });
                    historyContainer.appendChild(card);
                });
                renderChart(history);
            } else {
                noHistoryEl.style.display = 'block';
                 mmseChartCanvas.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load test history:', error);
            loadingEl.textContent = 'Could not load history.';
        }
    };

    const loadTotalTests = async () => {
        try {
            const totalTests = await getTotalTests();
            totalTestsCountEl.textContent = totalTests.total_tests;
        } catch (error) {
            console.error('Failed to load total tests:', error);
            totalTestsCountEl.textContent = 'N/A';
        }
    };

    const loadLatestScore = async () => {
        try {
            const history = await getTestHistory();
            if (history && history.length > 0) {
                // Get the most recent test score
                const latestTest = history[0]; // Assuming history is ordered by date descending
                const latestScoreEl = document.getElementById('latest-score');
                if (latestScoreEl) {
                    latestScoreEl.textContent = latestTest.mmse_score;
                }
            } else {
                const latestScoreEl = document.getElementById('latest-score');
                if (latestScoreEl) {
                    latestScoreEl.textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Failed to load latest score:', error);
            const latestScoreEl = document.getElementById('latest-score');
            if (latestScoreEl) {
                latestScoreEl.textContent = 'N/A';
            }
        }
    };





    const loadGames = async () => {
        try {
            bestScores = await getBestScores();
            userGames = await getUserGames();

            const games = [
                { type: 'memory_match', title: 'Memory Match' },
                { type: 'sequence_recall', title: 'Sequence Recall' },
                { type: 'pattern_recognition', title: 'Pattern Recognition' },
                { type: 'sliding_puzzle', title: 'Sliding Puzzle' },
                { type: 'memory_run_doors', title: 'Memory Run Doors' }
            ];

            games.forEach(game => {
                const bestData = bestScores[game.type] || null;
                console.log(`Creating card for ${game.type} with best data:`, bestData);
                const gameCard = createMiniGameCard(game.type, (gameType) => {
                    showGameModal(gameType);
                }, bestData);
                gamesContainer.appendChild(gameCard);
            });
        } catch (error) {
            console.error('Failed to load best scores:', error);
            // Fallback to loading games without best scores
            const games = [
                { type: 'memory_match', title: 'Memory Match' },
                { type: 'sequence_recall', title: 'Sequence Recall' },
                { type: 'pattern_recognition', title: 'Pattern Recognition' },
                { type: 'sliding_puzzle', title: 'Sliding Puzzle' },
                { type: 'memory_run_doors', title: 'Memory Run Doors' }
            ];

            games.forEach(game => {
                const gameCard = createMiniGameCard(game.type, (gameType) => {
                    showGameModal(gameType);
                });
                gamesContainer.appendChild(gameCard);
            });
        }
    };

    const reloadGames = async () => {
        // Clear existing cards
        gamesContainer.innerHTML = '';
        // Reload games
        await loadGames();
    };

    loadHistory();
    loadTotalTests();
    loadLatestScore();
    loadGames();

    const showGameModal = (gameType) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Brain Training Game</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div id="game-container"></div>
            </div>
        `;

        document.body.appendChild(modal);
        lucide.createIcons();

        // Initialize game
        const gameContainer = modal.querySelector('#game-container');
        let gameInstance;
        const currentBestScore = bestScores[gameType] || null;

        switch (gameType) {
            case 'memory_match':
                gameInstance = new MemoryMatchGame(gameContainer, currentBestScore ? currentBestScore.time : null);
                break;
            case 'sequence_recall':
                gameInstance = new SequenceRecallGame(gameContainer, currentBestScore ? currentBestScore.time : null, currentBestScore ? currentBestScore.score : null);
                break;
            case 'pattern_recognition':
                gameInstance = new PatternRecognitionGame(gameContainer, currentBestScore ? currentBestScore.time : null);
                break;
            case 'sliding_puzzle':
                gameInstance = new SlidingPuzzleGame(gameContainer, currentBestScore ? currentBestScore.time : null);
                break;
            case 'memory_run_doors':
                gameInstance = new MemoryRunGame(gameContainer, currentBestScore ? currentBestScore.time : null);
                break;
        }

        gameInstance.init();

        // Close modal
        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            // Reload games to update best scores after playing
            reloadGames();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                // Reload games to update best scores after playing
                reloadGames();
            }
        });
    };

    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        (async () => {
            await initChatbot(chatbotContainer);
        })();
    }
});
