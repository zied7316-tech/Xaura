import { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  fr: frTranslations,
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'fr') {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  // Get translation by key (supports nested keys like "common.dashboard")
  const t = (key, fallback = key) => {
    try {
      const keys = key.split('.');
      let value = translations[language];

      for (const k of keys) {
        value = value[k];
        if (value === undefined) {
          console.warn(`Translation missing for key: ${key} in language: ${language}`);
          return fallback;
        }
      }

      return value;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return fallback;
    }
  };

  const value = {
    language,
    changeLanguage,
    t,
    isEnglish: language === 'en',
    isFrench: language === 'fr',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default LanguageContext;


