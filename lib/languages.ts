/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Language Configuration
   Supported languages for speech recognition and AI interaction.
   ═══════════════════════════════════════════════════════════════ */

export interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  isEnglish: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', label: 'English', nativeLabel: 'English', flag: '🇺🇸', isEnglish: true },
  { code: 'fr-FR', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', isEnglish: false },
  { code: 'es-ES', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', isEnglish: false },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳', isEnglish: false },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', isEnglish: false },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳', isEnglish: false },
  { code: 'bn-IN', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳', isEnglish: false },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

export function getLanguageByCode(code: string): Language {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) ?? DEFAULT_LANGUAGE;
}
