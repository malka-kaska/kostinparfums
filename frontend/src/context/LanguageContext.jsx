import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from '../translations/en';
import { bg } from '../translations/bg';

const translations = { en, bg };

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

function detectBrowserLanguage() {
  const saved = localStorage.getItem('kostin_lang');
  if (saved && translations[saved]) return saved;

  const browserLang = navigator.language || navigator.userLanguage || '';
  if (browserLang.startsWith('bg')) return 'bg';
  return 'en';
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => detectBrowserLanguage());

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'bg' : 'en';
      localStorage.setItem('kostin_lang', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    if (translations[l]) {
      setLang(l);
      localStorage.setItem('kostin_lang', l);
    }
  }, []);

  const t = useCallback((key, params) => {
    let text = translations[lang]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
