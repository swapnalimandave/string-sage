import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-secondary'}`}
      >
        English
      </button>
      <button 
        onClick={() => changeLanguage('fr')}
        className={`px-3 py-1 rounded ${i18n.language === 'fr' ? 'bg-primary text-white' : 'bg-secondary'}`}
      >
        Français
      </button>
      <button 
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1 rounded ${i18n.language === 'ar' ? 'bg-primary text-white' : 'bg-secondary'}`}
      >
        العربية
      </button>
    </div>
  );
};
