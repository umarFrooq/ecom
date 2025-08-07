import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../locales/i18n'; // Adjust path to your i18n instance

// Mock i18n instance for testing if needed, or use the actual instance
// For this test, using the actual instance is fine as LanguageSwitcher depends on it.

// The component to test
import LanguageSwitcher from './LanguageSwitcher';

// Mock the useTranslation hook to control language and t function
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'), // Import and retain default behavior
  useTranslation: () => ({
    t: key => {
      if (key === 'currentLanguage') return 'Current Language: English'; // Mock t function
      if (key === 'toggleLanguage') return 'Switch to Arabic';
      return key;
    },
    i18n: {
      changeLanguage: jest.fn(), // Mock changeLanguage function
      language: 'en', // Default language for tests
      dir: () => 'ltr',
    },
  }),
}));


describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Reset i18n language to 'en' for consistent testing if using actual i18n object directly
    // i18n.changeLanguage('en');
  });

  test('renders buttons for English and Arabic', () => {
    render(
      <I18nextProvider i18n={i18n}> {/* Provide the i18n instance */}
        <LanguageSwitcher />
      </I18nextProvider>
    );

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('العربية (Arabic)')).toBeInTheDocument();
  });

  test('displays current language (mocked as English)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>
    );
    expect(screen.getByText('Current Language: English')).toBeInTheDocument();
  });

  test('calls i18n.changeLanguage with "ar" when Arabic button is clicked', () => {
    const { i18n: i18nMock } = useTranslation(); // Get the mocked i18n object

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>
    );

    const arabicButton = screen.getByText('العربية (Arabic)');
    fireEvent.click(arabicButton);
    expect(i18nMock.changeLanguage).toHaveBeenCalledWith('ar');
  });

  test('English button is disabled when current language is English (mocked)', () => {
    // useTranslation mock already sets language to 'en'
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>
    );
    expect(screen.getByText('English')).toBeDisabled();
    expect(screen.getByText('العربية (Arabic)')).not.toBeDisabled();
  });
});
