import i18next from 'https://cdn.jsdelivr.net/npm/i18next@23.7.6/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7.2.0/+esm';
import HttpApi from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@2.4.0/+esm';

class I18nManager {
    constructor() {
        this.isInitialized = false;
        this.currentLanguage = 'en';
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'zh'];
    }

    async init() {
        if (this.isInitialized) return;

        try {
            await i18next
                .use(HttpApi)
                .use(LanguageDetector)
                .init({
                    lng: 'en',
                    fallbackLng: 'en',
                    debug: false,

                    // Language detection options
                    detection: {
                        order: ['localStorage', 'navigator', 'htmlTag'],
                        lookupLocalStorage: 'i18nextLng',
                        caches: ['localStorage']
                    },

                    // Backend options
                    backend: {
                        loadPath: './locales/{{lng}}.json'
                    },

                    // Interpolation
                    interpolation: {
                        escapeValue: false
                    },

                    // Resources (fallback)
                    resources: {
                        en: {
                            translation: {
                                "nav": {
                                    "home": "Home",
                                    "assessment": "Assessment",
                                    "dashboard": "Dashboard",
                                    "games": "Brain Games",
                                    "about": "About"
                                }
                            }
                        }
                    }
                });

            this.isInitialized = true;
            this.currentLanguage = i18next.language;
            console.log('i18n initialized with language:', this.currentLanguage);

            // Listen for language changes
            i18next.on('languageChanged', (lng) => {
                this.currentLanguage = lng;
                this.updatePageContent();
                console.log('Language changed to:', lng);
            });

        } catch (error) {
            console.error('Failed to initialize i18n:', error);
        }
    }

    async changeLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn('Unsupported language:', lang);
            return;
        }

        try {
            await i18next.changeLanguage(lang);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    }

    t(key, options = {}) {
        return i18next.t(key, options);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    updatePageContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const options = element.getAttribute('data-i18n-options');

            let translation;
            if (options) {
                try {
                    const parsedOptions = JSON.parse(options);
                    translation = this.t(key, parsedOptions);
                } catch (e) {
                    translation = this.t(key);
                }
            } else {
                translation = this.t(key);
            }

            // Handle different element types
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.innerHTML = translation;
            }
        });

        // Update page title if it has data-i18n
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            document.title = this.t(titleElement.getAttribute('data-i18n'));
        }

        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    // Utility method to add i18n attributes to elements
    addTranslation(element, key, options = null) {
        element.setAttribute('data-i18n', key);
        if (options) {
            element.setAttribute('data-i18n-options', JSON.stringify(options));
        }
        element.innerHTML = this.t(key, options);
    }
}

// Create global instance
const i18nManager = new I18nManager();

// Export for use in other modules
window.i18nManager = i18nManager;

export default i18nManager;
