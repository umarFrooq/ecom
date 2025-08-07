import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './FloatingWhatsAppButton.css'; // For styling

const FloatingWhatsAppButton = () => {
  const { t } = useTranslation();
  // Ensure the WhatsApp number is configurable, possibly via environment variable or settings
  const whatsappNumber = t('contactInfo.whatsappNumber', '966558494648'); // Default or from i18n
  const defaultMessage = t('whatsapp.defaultMessage', 'Hello! I have a question.'); // Pre-filled message

  const openWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`, '_blank');
  };

  return (
    <button
      className="floating-whatsapp-button"
      onClick={openWhatsApp}
      aria-label={t('whatsapp.ariaLabel', 'Chat with us on WhatsApp')}
      title={t('whatsapp.ariaLabel', 'Chat with us on WhatsApp')}
    >
      <FontAwesomeIcon icon={faWhatsapp} />
      <span className="button-text">{t('whatsapp.chatText', 'Chat')}</span>
    </button>
  );
};

export default FloatingWhatsAppButton;
