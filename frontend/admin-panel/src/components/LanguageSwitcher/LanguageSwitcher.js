import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css'; // We'll create this for basic styling

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Basic styling for buttons
  const buttonStyle = {
    padding: '8px 15px',
    margin: '0 5px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0'
  };

  const activeButtonSyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  };


  return (
    <div className="language-switcher">
      <button
        style={i18n.language === 'en' ? activeButtonSyle : buttonStyle}
        onClick={() => changeLanguage('en')}
        disabled={i18n.language === 'en'}
      >
        English
      </button>
      <button
        style={i18n.language === 'ar' ? activeButtonSyle : buttonStyle}
        onClick={() => changeLanguage('ar')}
        disabled={i18n.language === 'ar'}
      >
        العربية (Arabic)
      </button>
      <p>{t('currentLanguage')}</p>
      {/* The "Switch to X" button from translation file is a bit redundant now */}
      {/* <button onClick={() => changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}>
        {t('toggleLanguage')}
      </button> */}
    </div>
  );
};

export default LanguageSwitcher;
