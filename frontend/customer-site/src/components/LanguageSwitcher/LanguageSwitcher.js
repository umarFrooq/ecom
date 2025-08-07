import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Dropdown
      className="language-switcher-dropdown"
      align={i18n.language === 'ar' ? 'start' : 'end'}
    >
      <Dropdown.Toggle variant="outline-secondary" size="sm" id="language-switcher-toggle">
        <FontAwesomeIcon icon={faGlobe} className={i18n.language === 'ar' ? 'ms-1' : 'me-1'} />
        {currentLanguage.code.toUpperCase()}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {languages.map((lang) => (
          <Dropdown.Item
            key={lang.code}
            active={i18n.language === lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
