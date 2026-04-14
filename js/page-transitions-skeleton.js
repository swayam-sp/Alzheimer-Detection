// 3D Page Transition System with Skeleton Loading
class PageTransitionManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.transitionBg = null;
        this.particlesContainer = null;
        this.isTransitioning = false;
        this.skeletonScreen = null;
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) return 'dashboard';
        if (path.includes('auth.html')) return 'auth';
        if (path.includes('high_risk_result.html')) return 'high-risk';
        if (path.includes('test.html')) return 'test';
        return 'index';
    }

    init() {
        this.createTransitionElements();
        this.setupPageBackground();
        this.setupNavigationListeners();
        this.createParticles();
        this.createSkeletonScreen();
        this.setupPageLoadHandler();
    }

    createTransitionElements() {
        // Create transition background
        this.transitionBg = document.createElement('div');
        this.transitionBg.className = 'page-transition-bg';
        document.body.appendChild(this.transitionBg);

        // Create particles container
        this.particlesContainer = document.createElement('div');
        this.particlesContainer.className = 'page-particles';
        this.transitionBg.appendChild(this.particlesContainer);

        // Create loading screen
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'page-loading-screen';
        loadingScreen.innerHTML = `
            <div class="page-loading-spinner"></div>
            <div class="page-loading-text">Loading...</div>
        `;
        document.body.appendChild(loadingScreen);
        this.loadingScreen = loadingScreen;
    }

    createSkeletonScreen() {
        // Create skeleton screen
        this.skeletonScreen = document.createElement('div');
        this.skeletonScreen.className = 'skeleton-screen';
        document.body.appendChild(this.skeletonScreen);

        // Add skeleton templates
        this.skeletonTemplates = {
            'index': this.createIndexSkeleton(),
            'dashboard': this.createDashboardSkeleton(),
            'auth': this.createAuthSkeleton(),
            'high-risk': this.createHighRiskSkeleton(),
            'test': this.createTestSkeleton()
        };
    }

    createIndexSkeleton() {
        return `
            <div class="skeleton-content skeleton-index">
                <div class="skeleton skeleton-3d skeleton-hero"></div>
                <div class="skeleton-features">
                    <div class="skeleton skeleton-3d skeleton-feature-card"></div>
                    <div class="skeleton skeleton-3d skeleton-feature-card"></div>
                    <div class="skeleton skeleton-3d skeleton-feature-card"></div>
                </div>
            </div>
        `;
    }

    createDashboardSkeleton() {
        return `
            <div class="skeleton-content skeleton-dashboard">
                <div class="skeleton skeleton-3d skeleton-header"></div>
                <div class="skeleton skeleton-3d skeleton-test-history"></div>
                <div class="skeleton skeleton-3d skeleton-chart"></div>
                <div class="skeleton-games">
                    <div class="skeleton skeleton-3d skeleton-game-card"></div>
                    <div class="skeleton skeleton-3d skeleton-game-card"></div>
                    <div class="skeleton skeleton-3d skeleton-game-card"></div>
                </div>
            </div>
        `;
    }

    createAuthSkeleton() {
        return `
            <div class="skeleton-content skeleton-auth">
                <div class="skeleton skeleton-3d skeleton-logo"></div>
                <div class="skeleton-form">
                    <div class="skeleton skeleton-3d skeleton-input"></div>
                    <div class="skeleton skeleton-3d skeleton-input"></div>
                    <div class="skeleton skeleton-3d skeleton-button"></div>
                </div>
            </div>
        `;
    }

    createHighRiskSkeleton() {
        return `
            <div class="skeleton-content skeleton-high-risk">
                <div class="skeleton skeleton-3d skeleton-result-card"></div>
            </div>
        `;
    }

    createTestSkeleton() {
        return `
            <div class="skeleton-content skeleton-test">
                <div class="skeleton-questionnaire">
                    <div class="skeleton skeleton-3d skeleton-question"></div>
                    <div class="skeleton skeleton-3d skeleton-question"></div>
                    <div class="skeleton skeleton-3d skeleton-question"></div>
                </div>
            </div>
        `;
    }

    setupPageLoadHandler() {
        // Hide skeleton when page content loads
        window.addEventListener('load', () => {
            this.hideSkeleton();
            this.isTransitioning = false;
            document.body.classList.remove('page-transitioning');
        });

        // Also hide on DOMContentLoaded as backup
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.hideSkeleton();
            }, 100);
        });
    }

    setupPageBackground() {
        const pageClasses = {
            'index': 'page-bg-index',
            'dashboard': 'page-bg-dashboard',
            'auth': 'page-bg-auth',
            'high-risk': 'page-bg-high-risk',
            'test': 'page-bg-test'
        };

        const bgClass = pageClasses[this.currentPage];
        if (bgClass) {
            this.transitionBg.classList.add(bgClass);
        }
    }

    createParticles() {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'page-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 6 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDelay = (Math.random() * 20) + 's';
            this.particlesContainer.appendChild(particle);
        }
    }

    setupNavigationListeners() {
        // Intercept all navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.hasAttribute('data-no-transition')) {
                const href = link.getAttribute('href');
                if (this.shouldTransition(href)) {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleBrowserNavigation();
        });
    }

    shouldTransition(href) {
        // Only transition between our main pages
        const pages = ['index.html', 'dashboard.html', 'auth.html', 'high_risk_result.html', 'test.html'];
        return pages.some(page => href.includes(page)) || href.startsWith('./') || href.startsWith('/');
    }

    async navigateTo(href) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Determine target page
        const targetPage = this.getTargetPage(href);

        // Show skeleton screen immediately
        this.showSkeletonForPage(targetPage);

        // Start transition out animation with smoother timing
        document.body.classList.add('page-transitioning');

        // Wait for transition to start with optimized delay
        await this.delay(150);

        // Navigate
        window.location.href = href;
    }

    getTargetPage(href) {
        if (href.includes('dashboard.html')) return 'dashboard';
        if (href.includes('auth.html')) return 'auth';
        if (href.includes('high_risk_result.html')) return 'high-risk';
        if (href.includes('test.html')) return 'test';
        return 'index';
    }

    showSkeletonForPage(page) {
        const template = this.skeletonTemplates[page];
        if (template) {
            this.skeletonScreen.innerHTML = template;
            this.skeletonScreen.classList.add('active');
        }
    }

    hideSkeleton() {
        this.skeletonScreen.classList.remove('active');
        setTimeout(() => {
            this.skeletonScreen.innerHTML = '';
        }, 300);
    }

    handleBrowserNavigation() {
        // Handle back/forward navigation
        const newPage = this.getCurrentPage();
        if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.updateBackgroundForPage(newPage);
        }
    }

    updateBackgroundForPage(page) {
        // Remove current background class
        this.transitionBg.className = 'page-transition-bg';

        // Add new background class
        const pageClasses = {
            'index': 'page-bg-index',
            'dashboard': 'page-bg-dashboard',
            'auth': 'page-bg-auth',
            'high-risk': 'page-bg-high-risk',
            'test': 'page-bg-test'
        };

        const bgClass = pageClasses[page];
        if (bgClass) {
            this.transitionBg.classList.add(bgClass);
        }

        // Update particles
        this.updateParticlesForPage(page);
    }

    updateParticlesForPage(page) {
        // Particles are styled based on parent background class
        // No additional updates needed as CSS handles theme-specific styling
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public method to trigger transition programmatically
    triggerTransition(targetPage) {
        const pageUrls = {
            'index': 'index.html',
            'dashboard': 'dashboard.html',
            'auth': 'auth.html',
            'high-risk': 'high_risk_result.html',
            'test': 'test.html'
        };

        const url = pageUrls[targetPage];
        if (url) {
            this.navigateTo(url);
        }
    }
}

// Add 3D hover effects to navigation links
const add3DHoverEffects = () => {
    const navLinks = document.querySelectorAll('a[href]');
    navLinks.forEach(link => {
        if (!link.classList.contains('nav-link-3d')) {
            link.classList.add('nav-link-3d');
        }
    });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page transition manager
    const pageTransitionManager = new PageTransitionManager();

    // Add 3D hover effects
    add3DHoverEffects();

    // Make transition manager globally available for programmatic navigation
    window.pageTransitionManager = pageTransitionManager;
});
