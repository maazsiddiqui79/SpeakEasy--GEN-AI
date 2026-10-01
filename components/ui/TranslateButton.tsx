'use client';

import { useState } from 'react';
import { SessionExchange } from '@/types/session';

interface TranslateButtonProps {
  exchanges: SessionExchange[];
  onTranslateComplete: (translatedExchanges: SessionExchange[]) => void;
  languageCode: string;
}

export default function TranslateButton({ exchanges, onTranslateComplete, languageCode }: TranslateButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);

  // Only show button if there are exchanges and the language is not English
  if (exchanges.length === 0 || languageCode.startsWith('en')) {
    return null;
  }

  const handleTranslate = async () => {
    setIsTranslating(true);
    
    try {
      const updatedExchanges = [...exchanges];
      
      for (let i = 0; i < updatedExchanges.length; i++) {
        const exchange = updatedExchanges[i];
        
        // Skip if already translated or empty
        if (exchange.translatedContent || !exchange.content.trim()) {
          continue;
        }

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: exchange.content,
            fromLanguage: languageCode
          }),
        });

        if (res.ok) {
          const data = await res.json();
          updatedExchanges[i].translatedContent = data.translatedText;
        }
      }
      
      onTranslateComplete(updatedExchanges);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '16px' }}>
      <button 
        className="btn btn-secondary" 
        onClick={handleTranslate} 
        disabled={isTranslating}
        title="Translate conversation to English"
      >
        {isTranslating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <svg className="spinner" viewBox="0 0 50 50" style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90 150" />
            </svg>
            Translating...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
            Translate to English
          </span>
        )}
      </button>
    </div>
  );
}
