import { submitTest } from './api.js';
import { createResultCard, createQuestionElement, createMiniGameCard } from './ui_components.js';
import { initChatbot } from './chatbot.js';
import { MemoryMatchGame, SequenceRecallGame, PatternRecognitionGame } from './mini_games.js';


document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const questions = [
        // Demographic Factors
        { id: 'age', text: 'What is your age?', type: 'slider', min: 5, max: 100, category: 'demographic' },
        { id: 'gender', text: 'What is your gender?', type: 'choice', options: ['Male', 'Female', 'Other'], category: 'demographic' },
        { id: 'ethnicity', text: 'What is your ethnicity?', type: 'choice', options: ['Caucasian', 'African American', 'Asian', 'Hispanic', 'Other'], category: 'demographic' },
        { id: 'education_level', text: 'What is your highest education level?', type: 'choice', options: ["No formal", "Primary", "Secondary", "Higher"], category: 'demographic' },
        { id: 'bmi', text: 'What is your BMI?', type: 'bmi', category: 'demographic' },

        // Lifestyle Factors
        { id: 'smoking', text: 'Do you smoke?', type: 'boolean', category: 'lifestyle' },
        { id: 'alcohol_consumption', text: 'How many alcoholic drinks do you have per week?', type: 'slider', min: 0, max: 30, category: 'lifestyle' },
        { id: 'physical_activity', text: 'How many hours of physical activity do you do per week?', type: 'slider', min: 0, max: 21, category: 'lifestyle' },
        { id: 'diet_quality', text: 'On a scale of 1-10, how would you rate your diet quality?', type: 'slider', min: 1, max: 10, category: 'lifestyle' },
        { id: 'sleep_quality', text: 'On a scale of 1-10, how would you rate your sleep quality?', type: 'slider', min: 1, max: 10, category: 'lifestyle' },

        // Medical Factors
        { id: 'family_history_alzheimers', text: 'Do you have a family history of Alzheimer\'s?', type: 'boolean', category: 'medical' },
        { id: 'cardiovascular_disease', text: 'Have you been diagnosed with cardiovascular disease?', type: 'boolean', category: 'medical' },
        { id: 'diabetes', text: 'Have you been diagnosed with diabetes?', type: 'boolean', category: 'medical' },
        { id: 'depression', text: 'Have you been diagnosed with depression?', type: 'boolean', category: 'medical' },
        { id: 'head_injury', text: 'Have you ever had a significant head injury?', type: 'boolean', category: 'medical' },
        { id: 'hypertension', text: 'Have you been diagnosed with hypertension?', type: 'boolean', category: 'medical' },

        // Cognitive Factors
        { id: 'mmse_score', text: 'What is your MMSE score?', type: 'slider', min: 0, max: 30, note: 'Take the MMSE test at <a href="https://mmse.neurol.ru/" target="_blank" class="text-violet-600 hover:text-violet-800 underline">mmse.neurol.ru</a> and enter your score here.', category: 'cognitive' },
        { id: 'memory_complaints', text: 'Do you experience frequent memory complaints?', type: 'boolean', category: 'cognitive' },
        { id: 'behavioral_problems', text: 'Have others noticed behavioral problems?', type: 'boolean', category: 'cognitive' },
        { id: 'confusion', text: 'Do you experience episodes of confusion?', type: 'boolean', category: 'cognitive' },
        { id: 'disorientation', text: 'Do you experience episodes of disorientation?', type: 'boolean', category: 'cognitive' },
        { id: 'personality_changes', text: 'Have you noticed changes in your personality?', type: 'boolean', category: 'cognitive' },
        { id: 'difficulty_completing_tasks', text: 'Do you have difficulty completing familiar tasks?', type: 'boolean', category: 'cognitive' },
        { id: 'forgetfulness', text: 'How would you describe your forgetfulness?', type: 'choice', options: ['Rarely', 'Occasionally', 'Frequently', 'Constantly'], category: 'cognitive' },
    ];

    let currentStep = 0;
    const answers = {};

    const wizardContainer = document.getElementById('wizard-container');
    const resultContainer = document.getElementById('result-container');
    const gamesSection = document.getElementById('games-section');
    const miniGamesContainer = document.getElementById('mini-games-container');
    const questionArea = document.getElementById('question-area');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    // Add subtle background animation container
    const bgContainer = document.createElement('div');
    bgContainer.className = 'questionnaire-bg progress-0';
    document.body.insertBefore(bgContainer, document.body.firstChild);

    // Add floating particles
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'progress-particles';
    bgContainer.appendChild(particlesContainer);

    // Create floating particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'progress-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particlesContainer.appendChild(particle);
    }
    
    const renderQuestion = (direction = 'forward') => {
        console.log('Rendering question:', currentStep, questions[currentStep]);
        const questionData = questions[currentStep];
        const questionContent = document.getElementById('question-content');

        // Add ultra-modern morphing transition effect
        const currentPage = questionContent.querySelector('.question-page');
        if (currentPage) {
            // Apply morphing exit animation to current page
            currentPage.classList.add('question-morph-out');

            // Remove the old page after animation
            setTimeout(() => {
                questionContent.innerHTML = '';
                createNewQuestionPage(questionData, direction);
            }, 250); // Half of animation duration
        } else {
            // First render, no animation needed
            questionContent.innerHTML = '';
            createNewQuestionPage(questionData, direction);
        }

        updateProgress();
        updateNav();
    };

    const createNewQuestionPage = (questionData, direction) => {
        const questionContent = document.getElementById('question-content');

        // Create new question page with ultra-modern effects
        const pageContainer = document.createElement('div');
        pageContainer.className = 'question-page';

        // Check if this is the first question in a category
        const isFirstInCategory = currentStep === 0 || questions[currentStep].category !== questions[currentStep - 1].category;
        const questionDataWithCategory = isFirstInCategory ? questionData : { ...questionData, category: null };

        const newQuestionEl = createQuestionElement(questionDataWithCategory, answers[questionData.id], (value) => {
            console.log('Answer changed for', questionData.id, 'value:', value);
            answers[questionData.id] = value;
            updateNav();
        });

        // Add staggered reveal animation classes
        const questionTitle = newQuestionEl.querySelector('h2');
        const questionNote = newQuestionEl.querySelector('.text-sm.text-slate-500');
        const questionInput = newQuestionEl.querySelector('.mt-8, .grid, .flex');

        if (questionTitle) questionTitle.classList.add('question-reveal', 'stagger-1');
        if (questionNote) questionNote.classList.add('question-reveal', 'stagger-2');
        if (questionInput) questionInput.classList.add('question-reveal', 'stagger-3');

        pageContainer.appendChild(newQuestionEl);
        questionContent.appendChild(pageContainer);

        // Apply morphing enter animation
        pageContainer.classList.add('question-morph-in');

        lucide.createIcons();
    };

    const updateProgress = () => {
        const percent = Math.round((currentStep / questions.length) * 100);
        progressText.textContent = `Step ${currentStep + 1} of ${questions.length}`;
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;

        // Update background animation based on progress
        const bgContainer = document.querySelector('.questionnaire-bg');
        if (bgContainer) {
            bgContainer.className = 'questionnaire-bg';
            if (percent === 0) {
                bgContainer.classList.add('progress-0');
            } else if (percent <= 25) {
                bgContainer.classList.add('progress-25');
            } else if (percent <= 50) {
                bgContainer.classList.add('progress-50');
            } else if (percent <= 75) {
                bgContainer.classList.add('progress-75');
            } else {
                bgContainer.classList.add('progress-100');
            }
        }
    };

    const updateNav = () => {
        prevBtn.disabled = currentStep === 0;

        const currentQuestion = questions[currentStep];
        const hasAnswer = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== null && answers[currentQuestion.id] !== '';
        console.log('updateNav - current question:', currentQuestion.id, 'hasAnswer:', hasAnswer, 'answer value:', answers[currentQuestion.id]);
        nextBtn.disabled = !hasAnswer;

        // Show/hide required message
        const requiredMessage = document.getElementById('required-message');
        if (requiredMessage) {
            requiredMessage.style.display = hasAnswer ? 'none' : 'block';
        }

        if (currentStep === questions.length - 1) {
            nextBtn.textContent = 'Submit Test';
        } else {
            nextBtn.textContent = 'Next';
        }
    };

    const showResult = async () => {
        wizardContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        // Show loading animation
        resultContainer.innerHTML = `
            <div class="skeleton-result-analysis">
                <div class="floating-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>

                <!-- Loading Animation Container -->
                <div class="loading-analysis-container">
                    <!-- Animated Brain Icon -->
                    <div class="brain-loading-icon">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.5 2C10.0523 2 10.5 2.44772 10.5 3V4.5C10.5 5.05228 10.0523 5.5 9.5 5.5C8.94772 5.5 8.5 5.05228 8.5 4.5V3C8.5 2.44772 8.94772 2 9.5 2Z" fill="#8B5CF6"/>
                            <path d="M14.5 2C15.0523 2 15.5 2.44772 15.5 3V4.5C15.5 5.05228 15.0523 5.5 14.5 5.5C13.9477 5.5 13.5 5.05228 13.5 4.5V3C13.5 2.44772 13.9477 2 14.5 2Z" fill="#8B5CF6"/>
                            <path d="M12 4C13.6569 4 15 5.34315 15 7V8C15 9.65685 13.6569 11 12 11C10.3431 11 9 9.65685 9 8V7C9 5.34315 10.3431 4 12 4Z" fill="#8B5CF6"/>
                            <path d="M7 8C7 6.89543 7.89543 6 9 6H10C10.5523 6 11 6.44772 11 7C11 7.55228 10.5523 8 10 8H9C8.44772 8 8 8.44772 8 9V15C8 15.5523 8.44772 16 9 16H10C10.5523 16 11 16.4477 11 17C11 17.5523 10.5523 18 10 18H9C7.89543 18 7 17.1046 7 16V8Z" fill="#8B5CF6"/>
                            <path d="M17 8C17 6.89543 16.1046 6 15 6H14C13.4477 6 13 6.44772 13 7C13 7.55228 13.4477 8 14 8H15C15.5523 8 16 8.44772 16 9V15C16 15.5523 15.5523 16 15 16H14C13.4477 16 13 16.4477 13 17C13 17.5523 13.4477 18 14 18H15C16.1046 18 17 17.1046 17 16V8Z" fill="#8B5CF6"/>
                            <path d="M5 10C5 9.44772 5.44772 9 6 9C6.55228 9 7 9.44772 7 10V14C7 14.5523 6.55228 15 6 15C5.44772 15 5 14.5523 5 14V10Z" fill="#8B5CF6"/>
                            <path d="M19 10C19 9.44772 18.5523 9 18 9C17.4477 9 17 9.44772 17 10V14C17 14.5523 17.4477 15 18 15C18.5523 15 19 14.5523 19 14V10Z" fill="#8B5CF6"/>
                            <path d="M4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12V16C6 16.5523 5.55228 17 5 17C4.44772 17 4 16.5523 4 16V12Z" fill="#8B5CF6"/>
                            <path d="M20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12V16C18 16.5523 18.4477 17 19 17C19.5523 17 20 16.5523 20 16V12Z" fill="#8B5CF6"/>
                        </svg>
                    </div>

                    <!-- Loading Text -->
                    <div class="loading-text">
                        <h2 class="loading-title">Analyzing Your Results</h2>
                        <p class="loading-subtitle">Processing your cognitive assessment...</p>
                    </div>

                    <!-- Progress Indicators -->
                    <div class="progress-indicators">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="step active">Processing Data</div>
                            <div class="step">Analyzing Patterns</div>
                            <div class="step">Calculating Risk</div>
                            <div class="step">Generating Report</div>
                        </div>
                    </div>

                    <!-- Loading Cards -->
                    <div class="loading-cards">
                        <div class="loading-card">
                            <div class="skeleton skeleton-card-icon"></div>
                            <div class="skeleton skeleton-card-title"></div>
                            <div class="skeleton skeleton-card-content"></div>
                        </div>
                        <div class="loading-card">
                            <div class="skeleton skeleton-card-icon"></div>
                            <div class="skeleton skeleton-card-title"></div>
                            <div class="skeleton skeleton-card-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add delay to simulate longer analysis time
        await new Promise(resolve => setTimeout(resolve, 4000));

        try {
            // Store answers in localStorage for report generation
            localStorage.setItem('assessmentAnswers', JSON.stringify(answers));

            const submissionData = { ...answers };
            questions.forEach(q => {
                if (q.type === 'boolean') {
                    submissionData[q.id] = submissionData[q.id] === 'Yes';
                }
                if(q.type === 'slider' || q.id === 'alcohol_consumption'){
                    submissionData[q.id] = parseFloat(submissionData[q.id])
                }
                if(q.type === 'bmi' && submissionData[q.id]){
                    submissionData[q.id] = submissionData[q.id].bmi;
                }
            });

            const result = await submitTest(submissionData);

            // Store result data for the comprehensive result page
            localStorage.setItem('assessmentResult', JSON.stringify(result));

            // Update test counts in localStorage for main dashboard
            const currentTotalTests = parseInt(localStorage.getItem('totalTests') || '1100');
            const currentEarlyDetections = parseInt(localStorage.getItem('earlyDetections') || '100');
            const currentHealthyUsers = parseInt(localStorage.getItem('healthyUsers') || '1000');

            // Increment total tests
            localStorage.setItem('totalTests', (currentTotalTests + 1).toString());

            // Increment based on risk level
            if (result.risk_level === 'High Risk') {
                localStorage.setItem('earlyDetections', (currentEarlyDetections + 1).toString());
            } else {
                localStorage.setItem('healthyUsers', (currentHealthyUsers + 1).toString());
            }

            // Redirect to the high_risk_result.html page
            window.location.href = 'high_risk_result.html';

        } catch (error) {
            console.error('Submission failed:', error);
            // Show error result card
            const errorResult = { risk_level: 'Error' };
            const errorCard = createResultCard(errorResult, 'Unable to load result data. Please try taking the test again.', answers);
            const resultCardContainer = document.getElementById('result-card');
            if (resultCardContainer) {
                resultCardContainer.innerHTML = '';
                resultCardContainer.appendChild(errorCard);
            } else {
                resultContainer.innerHTML = '';
                resultContainer.appendChild(errorCard);
            }
        }
    };



    const showMiniGames = () => {
        gamesSection.style.display = 'block';
        miniGamesContainer.innerHTML = '';

        const games = [
            { type: 'memory_match', title: 'Memory Match' },
            { type: 'sequence_recall', title: 'Sequence Recall' },
            { type: 'pattern_recognition', title: 'Pattern Recognition' }
        ];

        games.forEach(game => {
            const gameCard = createMiniGameCard(game.type, (gameType) => {
                showGameModal(gameType);
            });
            miniGamesContainer.appendChild(gameCard);
        });
    };

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

        switch (gameType) {
            case 'memory_match':
                gameInstance = new MemoryMatchGame(gameContainer);
                break;
            case 'sequence_recall':
                gameInstance = new SequenceRecallGame(gameContainer);
                break;
            case 'pattern_recognition':
                gameInstance = new PatternRecognitionGame(gameContainer);
                break;
        }

        gameInstance.init();

        // Close modal
        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    };

    nextBtn.addEventListener('click', (e) => {
        console.log('Next button clicked, current step:', currentStep, 'answers:', answers);
        if (currentStep < questions.length - 1) {
            currentStep++;
            renderQuestion('forward');
        } else {
            showResult();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            renderQuestion('backward');
        }
    });

    // Add 3D button classes to navigation buttons
    nextBtn.classList.add('questionnaire-nav-btn');
    prevBtn.classList.add('questionnaire-nav-btn');


    renderQuestion();

    // Add download report function
    window.downloadReport = async function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Get stored data
        const answers = JSON.parse(localStorage.getItem('assessmentAnswers') || '{}');
        const result = JSON.parse(localStorage.getItem('assessmentResult') || '{}');

        // Add title
        doc.setFontSize(20);
        doc.text('Alzheimer\'s Risk Assessment Report', 20, 30);

        // Add date
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

        // Add risk level
        doc.setFontSize(16);
        doc.text(`Risk Level: ${result.risk_level || 'N/A'}`, 20, 60);
        doc.text(`Probability: ${(result.probability * 100 || 0).toFixed(1)}%`, 20, 75);

        // Add key factors summary
        doc.setFontSize(14);
        doc.text('Key Risk Factors:', 20, 95);

        let yPos = 110;
        const factors = [
            `Age: ${answers.age || 'N/A'}`,
            `Smoking: ${answers.smoking || 'N/A'}`,
            `Alcohol Consumption: ${answers.alcohol_consumption || 'N/A'} drinks/week`,
            `Physical Activity: ${answers.physical_activity || 'N/A'} hours/week`,
            `Family History: ${answers.family_history_alzheimers || 'N/A'}`,
            `MMSE Score: ${answers.mmse_score || 'N/A'}`
        ];

        factors.forEach(factor => {
            doc.setFontSize(10);
            doc.text(factor, 20, yPos);
            yPos += 10;
        });

        // Add recommendations
        yPos += 10;
        doc.setFontSize(14);
        doc.text('Recommendations:', 20, yPos);
        yPos += 15;

        const recommendations = [
            '• Consult a healthcare professional for comprehensive evaluation',
            '• Maintain regular physical activity',
            '• Follow a balanced diet',
            '• Monitor cognitive health regularly',
            '• Stay socially active and engaged'
        ];

        recommendations.forEach(rec => {
            doc.setFontSize(10);
            doc.text(rec, 20, yPos);
            yPos += 8;
        });

        // Add disclaimer
        yPos += 15;
        doc.setFontSize(8);
        const disclaimer = 'Disclaimer: This assessment is for informational purposes only and should not replace professional medical advice.';
        const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
        doc.text(splitDisclaimer, 20, yPos);

        // Save the PDF
        doc.save('alzheimers_risk_assessment_report.pdf');
    };

    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        (async () => {
            await initChatbot(chatbotContainer);
        })();
    }
});
