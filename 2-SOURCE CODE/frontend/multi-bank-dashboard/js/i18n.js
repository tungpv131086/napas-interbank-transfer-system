// Internationalization (i18n) Manager
// Handles language switching and translations

export class I18nManager {
  constructor() {
    this.currentLanguage = this.getSavedLanguage() || 'en';
    this.translations = {};
    this.listeners = new Set();
  }

  // Get saved language from localStorage
  getSavedLanguage() {
    try {
      return localStorage.getItem('app-language');
    } catch (e) {
      return null;
    }
  }

  // Save language to localStorage
  saveLanguage(lang) {
    try {
      localStorage.setItem('app-language', lang);
    } catch (e) {
      console.warn('Could not save language preference', e);
    }
  }

  // Load translations for a specific language
  async loadTranslations(lang) {
    try {
      const response = await fetch(`./translations/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      const translations = await response.json();
      this.translations[lang] = translations;
      return true;
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      return false;
    }
  }

  // Initialize i18n system
  async initialize() {
    // Load default language (English)
    await this.loadTranslations('en');

    // Load current language if different
    if (this.currentLanguage !== 'en') {
      await this.loadTranslations(this.currentLanguage);
    }

    console.log(`✓ i18n initialized with language: ${this.currentLanguage}`);
  }

  // Get translation by key
  // Supports nested keys like 'common.login' or 'dashboard.balance.title'
  t(key, params = {}) {
    const translation = this.getNestedTranslation(key, this.currentLanguage);

    // Fallback to English if translation not found
    if (translation === key && this.currentLanguage !== 'en') {
      const fallback = this.getNestedTranslation(key, 'en');
      if (fallback !== key) {
        console.warn(`Translation missing for '${key}' in ${this.currentLanguage}, using English`);
        return this.replacePlaceholders(fallback, params);
      }
    }

    return this.replacePlaceholders(translation, params);
  }

  // Get nested translation value
  getNestedTranslation(key, lang) {
    if (!this.translations[lang]) {
      return key;
    }

    const keys = key.split('.');
    let value = this.translations[lang];

    for (const k of keys) {
      if (value === undefined || value === null) {
        return key;
      }
      value = value[k];
    }

    return value !== undefined ? value : key;
  }

  // Replace placeholders in translation strings
  // Example: "Hello {name}" with params {name: "John"} -> "Hello John"
  replacePlaceholders(text, params) {
    if (typeof text !== 'string') return text;

    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  // Change current language
  async changeLanguage(lang) {
    if (lang === this.currentLanguage) {
      return;
    }

    // Load translations if not already loaded
    if (!this.translations[lang]) {
      const loaded = await this.loadTranslations(lang);
      if (!loaded) {
        console.error(`Failed to change language to ${lang}`);
        return;
      }
    }

    this.currentLanguage = lang;
    this.saveLanguage(lang);

    // Notify all listeners
    this.notifyListeners();

    console.log(`Language changed to: ${lang}`);
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get available languages
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
    ];
  }

  // Subscribe to language changes
  subscribe(callback) {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of language change
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.currentLanguage);
    });
  }

  // Translate and format number
  formatNumber(value, options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLanguage === 'vi' ? 'vi-VN' : 'en-US', options).format(value);
    } catch (e) {
      return value.toString();
    }
  }

  // Translate and format currency
  formatCurrency(value) {
    try {
      const currencyCode = this.t('currency.code');
      const locale = this.currentLanguage === 'vi' ? 'vi-VN' : 'en-US';

      // For VND, format number and add symbol at the end
      if (currencyCode === 'VND') {
        const formatted = new Intl.NumberFormat(locale).format(value);
        return `${formatted}₫`;
      }

      // For other currencies, use standard currency formatting
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
      }).format(value);
    } catch (e) {
      const symbol = this.t('currency.symbol');
      const formatted = value.toLocaleString();
      // Put VND symbol at the end, others at the beginning
      return symbol === '₫' ? `${formatted}${symbol}` : `${symbol}${formatted}`;
    }
  }

  // Format date
  formatDate(date, options = {}) {
    try {
      const locale = this.currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
      return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    } catch (e) {
      return new Date(date).toLocaleString();
    }
  }
}
