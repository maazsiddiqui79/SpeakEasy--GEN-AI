'use client';

import { useState } from 'react';
import { RecoverySuggestion } from '@/types/speech';
import { SpeechAnalysis } from '@/types/speech';
import { SessionExchange } from '@/types/session';
import CopyButton from '@/components/ui/CopyButton';
import styles from './SpeechFeedback.module.css';

interface SpeechFeedbackProps {
  suggestions: RecoverySuggestion[];
  positiveMessage: string;
  focusArea: string;
  fillerDisplay: string;
  overallScore: number;
  reportContext?: {
    mode: string;
    subject: string;
    analysis: SpeechAnalysis;
    exchanges: SessionExchange[];
  };
}

export default function SpeechFeedback({
  suggestions,
  positiveMessage,
  focusArea,
  fillerDisplay,
  overallScore,
  reportContext,
}: SpeechFeedbackProps) {
  const [isExporting, setIsExporting] = useState(false);
  if (suggestions.length === 0 && !positiveMessage) return null;

  const getSeverityIcon = (severity: RecoverySuggestion['severity']) => {
    switch (severity) {
      case 'important': return <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-error)' }} />;
      case 'warning': return <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-warning)' }} />;
      case 'info': return <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }} />;
    }
  };

  const getTypeLabel = (type: RecoverySuggestion['type']) => {
    switch (type) {
      case 'fumbling': return 'Fumbling Detected';
      case 'filler': return 'Filler Words';
      case 'weak-word': return 'Vague Wording';
      case 'pacing': return 'Pacing';
      case 'transition': return 'Weak Transition';
      case 'explanation': return 'Unclear Explanation';
    }
  };

  return (
    <div className={styles.feedback}>
      {/* Score */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreRing}>
          <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
            <circle cx="50" cy="50" r="42" className={styles.scoreTrack} />
            <circle
              cx="50" cy="50" r="42"
              className={styles.scoreProgress}
              style={{
                strokeDasharray: `${2 * Math.PI * 42}`,
                strokeDashoffset: `${2 * Math.PI * 42 * (1 - overallScore / 100)}`,
              }}
            />
          </svg>
          <span className={styles.scoreValue}>{overallScore}</span>
        </div>
        <span className={styles.scoreLabel}>Overall Score</span>
      </div>

      {/* Filler Counter */}
      {fillerDisplay && (
        <div className={styles.fillerCounter}>
          <div className={styles.fillerLabel}>Filler Words</div>
          <div className={styles.fillerCounts}>{fillerDisplay}</div>
        </div>
      )}

      {/* Positive Reinforcement */}
      {positiveMessage && (
        <div className={styles.positive}>
          <p>{positiveMessage}</p>
        </div>
      )}

      {/* Recovery Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <h4 className={styles.suggestionsTitle}>Speech Analysis</h4>
          {suggestions.map((suggestion, index) => (
            <div key={index} className={(styles.suggestion) + (styles["severity_" + suggestion.severity])}>
              <div className={styles.suggestionHeader}>
                <span className={styles.suggestionIcon} style={{ display: 'flex', alignItems: 'center' }}>{getSeverityIcon(suggestion.severity)}</span>
                <span className={styles.suggestionType}>{getTypeLabel(suggestion.type)}</span>
              </div>

              <div className={styles.suggestionBody}>
                <div className={styles.problematic}>
                  <span className={styles.label}>Detected:</span>
                  <p>{suggestion.problematicText}</p>
                </div>

                <div className={styles.explanation}>
                  <span className={styles.label}>Why it matters:</span>
                  <p>{suggestion.explanation}</p>
                </div>

                <div className={styles.technique}>
                  <span className={styles.label}>Recovery:</span>
                  <p>{suggestion.technique}</p>
                </div>

                <div className={styles.alternative}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <span className={styles.label}>Try instead:</span>
                      <p className={styles.alternativeText}>{suggestion.suggestedPhrase}</p>
                    </div>
                    <CopyButton text={suggestion.suggestedPhrase} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Focus Area */}
      {focusArea && (
        <div className={styles.focusArea}>
          <p>{focusArea}</p>
        </div>
      )}

      {/* Export Action removed */}
      <div className={styles.exportSection} style={{ display: 'none' }}>
        <button
          className="btn btn-secondary" 
          disabled={isExporting || !reportContext}
          onClick={async () => {
            if (!reportContext) return;
            setIsExporting(true);
            try {
              console.log("PDF generation removed from SpeechFeedback");
            } finally {
              setIsExporting(false);
            }
          }}
          title="Download a text-based PDF report"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{isExporting ? 'Creating PDF...' : 'Download PDF Report'}</span>
        </button>
        <p className={styles.exportHint}>A structured, selectable-text report is downloaded directly.</p>
      </div>
    </div>
  );
}
