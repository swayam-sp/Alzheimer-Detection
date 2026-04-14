import { initChatbot } from './chatbot.js';
import { getTotalTests, getEarlyDetections, getLowRiskCount, getNoRiskCount } from './api.js';
import { supabase } from './supabase.js';
import { motion } from 'framer-motion';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTestsCountEl = document.getElementById('total-tests-count');
    const alzheimersDetectedEl = document.getElementById('alzheimers-detected');
    const healthyUsersEl = document.getElementById('healthy-users');
    const testsChartCanvas = document.getElementById('tests-chart');

    const updateAuthUI = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            dashboardBtn.style.display = 'inline-flex';
            logoutBtn.style.display = 'inline-flex';
        } else {
            loginBtn.style.display = 'inline-flex';
            registerBtn.style.display = 'inline-flex';
            dashboardBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    };

    updateAuthUI();

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            updateAuthUI();
            window.location.href = 'index.html';
        });
    }


    if (totalTestsCountEl) {
        // Start with fallback data immediately for better UX
        const baseTotal = 1000; // Start from 1000 to display some number
        const baseDetected = 100; // Start from 100 for early detections
        const baseHealthy = 1000; // Start from 1000 for healthy users
        let displayTests = baseTotal;

        // Set initial display immediately to avoid showing 0
        totalTestsCountEl.textContent = baseTotal.toLocaleString();

        // Animate with initial fallback data
        let start = baseTotal;
        const duration = 1500;
        const increment = (displayTests - baseTotal) / (duration / 16);

        const updateCount = () => {
            start += increment;
            if (start < displayTests) {
                totalTestsCountEl.textContent = Math.ceil(start).toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                totalTestsCountEl.textContent = displayTests.toLocaleString();
            }
        };
        if (displayTests > baseTotal) {
            updateCount();
        }

        // Try to fetch real data and update if available
        getTotalTests()
            .then(data => {
                if (data && typeof data.total_tests !== 'undefined') {
                    const realDisplayTests = baseTotal + data.total_tests;
                    if (realDisplayTests !== displayTests) {
                        displayTests = realDisplayTests;
                        // Re-animate with real data
                        start = parseInt(totalTestsCountEl.textContent.replace(/,/g, '')) || 0;
                        const realIncrement = (displayTests - start) / (duration / 16);

                        const updateRealCount = () => {
                            start += realIncrement;
                            if (start < displayTests) {
                                totalTestsCountEl.textContent = Math.ceil(start).toLocaleString();
                                requestAnimationFrame(updateRealCount);
                            } else {
                                totalTestsCountEl.textContent = displayTests.toLocaleString();
                            }
                        };
                        updateRealCount();
                    }
                }
            })
            .catch(error => {
                console.error('Failed to fetch total tests, using fallback:', error);
                // Keep the fallback data that's already animated
            });

        // Get community impact data from the updated API
        getTotalTests()
            .then(data => {
                const actualDetections = data.early_detections || 0;
                const lowRiskCount = data.low_risk_count || 0;
                const noRiskCount = data.no_risk_count || 0;
                const healthyUsers = data.healthy_users || 0;

                const alzheimersCount = baseDetected + actualDetections;
                const totalActualTests = actualDetections + lowRiskCount + noRiskCount;
                const healthyCount = baseHealthy + healthyUsers;

                // Animate alzheimers detected (HTML now has 0 as default)
                if (alzheimersDetectedEl) {
                    let alzStart = 0;
                    const alzEnd = alzheimersCount;
                    const alzIncrement = alzEnd / (duration / 16);
                    const updateAlz = () => {
                        alzStart += alzIncrement;
                        if (alzStart < alzEnd) {
                            alzheimersDetectedEl.textContent = Math.ceil(alzStart).toLocaleString();
                            requestAnimationFrame(updateAlz);
                        } else {
                            alzheimersDetectedEl.textContent = alzEnd.toLocaleString();
                        }
                    };
                    updateAlz();
                }

                // Animate healthy users (HTML now has 0 as default)
                if (healthyUsersEl) {
                    let healthyStart = 0;
                    const healthyEnd = healthyCount;
                    const healthyIncrement = healthyEnd / (duration / 16);
                    const updateHealthy = () => {
                        healthyStart += healthyIncrement;
                        if (healthyStart < healthyEnd) {
                            healthyUsersEl.textContent = Math.ceil(healthyStart).toLocaleString();
                            requestAnimationFrame(updateHealthy);
                        } else {
                            healthyUsersEl.textContent = healthyEnd.toLocaleString();
                        }
                    };
                    updateHealthy();
                }

                // Update total tests count with real data
                const realTotalTests = baseTotal + totalActualTests;
                if (realTotalTests !== displayTests) {
                    displayTests = realTotalTests;
                    // Re-animate with real data
                    start = parseInt(totalTestsCountEl.textContent.replace(/,/g, '')) || 0;
                    const realIncrement = (displayTests - start) / (duration / 16);

                    const updateRealTotal = () => {
                        start += realIncrement;
                        if (start < displayTests) {
                            totalTestsCountEl.textContent = Math.ceil(start).toLocaleString();
                            requestAnimationFrame(updateRealTotal);
                        } else {
                            totalTestsCountEl.textContent = displayTests.toLocaleString();
                        }
                    };
                    updateRealTotal();
                }

                // Update the doughnut chart in index.html
                if (testsChartCanvas && window.Chart) {
                    const ctx = testsChartCanvas.getContext('2d');

                    // Use actual data from database for the chart
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Low Risk', 'No Risk'],
                            datasets: [{
                                data: [lowRiskCount, noRiskCount],
                                backgroundColor: ['#10b981', '#3b82f6'],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: false,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Failed to fetch community impact data:', error);
                // Fallback to simulated data
                const additionalDetected = Math.floor(displayTests * 0.3);
                const alzheimersCount = baseDetected + additionalDetected;
                const healthyCount = displayTests - alzheimersCount;

                // Animate alzheimers detected (HTML now has 0 as default)
                if (alzheimersDetectedEl) {
                    let alzStart = 0;
                    const alzEnd = alzheimersCount;
                    const alzIncrement = alzEnd / (duration / 16);
                    const updateAlz = () => {
                        alzStart += alzIncrement;
                        if (alzStart < alzEnd) {
                            alzheimersDetectedEl.textContent = Math.ceil(alzStart).toLocaleString();
                            requestAnimationFrame(updateAlz);
                        } else {
                            alzheimersDetectedEl.textContent = alzEnd.toLocaleString();
                        }
                    };
                    updateAlz();
                }

                // Animate healthy users (HTML now has 0 as default)
                if (healthyUsersEl) {
                    let healthyStart = 0;
                    const healthyEnd = healthyCount;
                    const healthyIncrement = healthyEnd / (duration / 16);
                    const updateHealthy = () => {
                        healthyStart += healthyIncrement;
                        if (healthyStart < healthyEnd) {
                            healthyUsersEl.textContent = Math.ceil(healthyStart).toLocaleString();
                            requestAnimationFrame(updateHealthy);
                        } else {
                            healthyUsersEl.textContent = healthyEnd.toLocaleString();
                        }
                    };
                    updateHealthy();
                }

                // Update the doughnut chart in index.html
                if (testsChartCanvas && window.Chart) {
                    const ctx = testsChartCanvas.getContext('2d');

                    // Calculate low risk and no risk based on simulated data
                    const lowRiskCount = Math.max(0, displayTests - alzheimersCount - healthyCount);
                    const noRiskCount = healthyCount;

                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Low Risk', 'No Risk'],
                            datasets: [{
                                data: [lowRiskCount, noRiskCount],
                                backgroundColor: ['#10b981', '#3b82f6'],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: false,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                }
            });
    }


    // Initialize Framer Motion animations
    const initAnimations = () => {
        // Hero section animations
        const heroSection = document.querySelector('[data-motion="hero"]');
        if (heroSection) {
            motion.animate(
                heroSection,
                { opacity: [0, 1], y: [50, 0] },
                { duration: 1, ease: "easeOut" }
            );
        }

        // How it works section animations
        const howItWorksSection = document.querySelector('[data-motion="how-it-works"]');
        if (howItWorksSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const cards = howItWorksSection.querySelectorAll('[data-step]');
                        cards.forEach((card, index) => {
                            motion.animate(
                                card,
                                { opacity: [0, 1], y: [60, 0] },
                                { duration: 0.8, delay: index * 0.2, ease: "easeOut" }
                            );
                        });
                    }
                });
            }, { threshold: 0.3 });
            observer.observe(howItWorksSection);
        }

        // About Alzheimer's section animations
        const aboutAlzheimersSection = document.querySelector('[data-motion="about-alzheimers"]');
        if (aboutAlzheimersSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const symptomCards = aboutAlzheimersSection.querySelectorAll('.grid.md\\:grid-cols-3 .bg-white');
                        const advantageCards = aboutAlzheimersSection.querySelectorAll('.grid.md\\:grid-cols-2 .bg-gradient-to-br');
                        const riskCards = aboutAlzheimersSection.querySelectorAll('.bg-gradient-to-r.from-red-50 .grid.md\\:grid-cols-3 .text-center');

                        // Animate symptom cards
                        symptomCards.forEach((card, index) => {
                            motion.animate(
                                card,
                                { opacity: [0, 1], y: [60, 0] },
                                { duration: 0.8, delay: index * 0.2, ease: "easeOut" }
                            );
                        });

                        // Animate advantage cards
                        advantageCards.forEach((card, index) => {
                            motion.animate(
                                card,
                                { opacity: [0, 1], x: [-50, 0] },
                                { duration: 0.8, delay: (symptomCards.length * 0.2) + (index * 0.15), ease: "easeOut" }
                            );
                        });

                        // Animate risk cards
                        riskCards.forEach((card, index) => {
                            motion.animate(
                                card,
                                { opacity: [0, 1], y: [60, 0] },
                                { duration: 0.8, delay: (symptomCards.length * 0.2) + (advantageCards.length * 0.15) + (index * 0.2), ease: "easeOut" }
                            );
                        });
                    }
                });
            }, { threshold: 0.2 });
            observer.observe(aboutAlzheimersSection);
        }

        // Features section animations
        const featuresSection = document.querySelector('[data-motion="features"]');
        if (featuresSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const features = featuresSection.querySelectorAll('[data-feature]');
                        features.forEach((feature, index) => {
                            motion.animate(
                                feature,
                                { opacity: [0, 1], x: [-50, 0] },
                                { duration: 0.8, delay: index * 0.15, ease: "easeOut" }
                            );
                        });
                    }
                });
            }, { threshold: 0.3 });
            observer.observe(featuresSection);
        }
    };

    // Initialize particle effect
    const initParticles = () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-5';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = () => {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            };
        };

        const initParticlesArray = () => {
            particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push(createParticle());
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animateParticles);
        };

        resizeCanvas();
        initParticlesArray();
        animateParticles();

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticlesArray();
        });
    };

    // Initialize all enhancements
    initAnimations();
    initParticles();

    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        (async () => {
            await initChatbot(chatbotContainer);
        })();
    }
});
