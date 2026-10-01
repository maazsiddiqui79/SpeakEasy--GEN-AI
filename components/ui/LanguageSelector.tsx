'use client';

import { SUPPORTED_LANGUAGES, Language } from '@/lib/languages';
import styles from './LanguageSelector.module.css';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onChange: (language: Language) => void;
}

export default function LanguageSelector({ selectedLanguage, onChange }: LanguageSelectorProps) {
  return (
    <div className={styles.languageSelectorWrapper}>
      <span className={styles.langIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </span>
      <span className={styles.langLabel}>Language</span>
      <select
        className={styles.select}
        value={selectedLanguage.code}
        onChange={(e) => {
          const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
          if (lang) onChange(lang);
        }}
        id="language-selector"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label} — {lang.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
