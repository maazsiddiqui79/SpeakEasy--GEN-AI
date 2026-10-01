/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Weak Word Detector
   
   Identifies vague, imprecise, or weak wording and provides
   context-specific replacement suggestions.
   ═══════════════════════════════════════════════════════════════ */

import { WeakWordAnalysis, WeakWordOccurrence } from '@/types/speech';
import { WEAK_WORDS, WEAK_TRANSITIONS } from './constants';

/**
 * Analyze transcript for weak/vague wording
 */
export function detectWeakWords(transcript: string): WeakWordAnalysis {
  const occurrences: WeakWordOccurrence[] = [];
  const normalizedTranscript = transcript.toLowerCase();

  // Check multi-word weak phrases first (longer matches first)
  const sortedWeakWords = Object.keys(WEAK_WORDS).sort((a, b) => b.length - a.length);

  for (const weakWord of sortedWeakWords) {
    let searchFrom = 0;
    while (true) {
      const idx = normalizedTranscript.indexOf(weakWord, searchFrom);
      if (idx === -1) break;

      // Word boundary check
      const before = idx > 0 ? normalizedTranscript[idx - 1] : ' ';
      const after = idx + weakWord.length < normalizedTranscript.length
        ? normalizedTranscript[idx + weakWord.length]
        : ' ';

      if (/[\s,.'"]/.test(before) && /[\s,.'"]/.test(after)) {
        // Skip if already covered by a longer match
        const alreadyCovered = occurrences.some(
          o => idx >= o.position && idx < o.position + o.word.length
        );

        if (!alreadyCovered) {
          const context = getContext(transcript, idx, weakWord.length);
          occurrences.push({
            word: weakWord,
            position: idx,
            context,
            explanation: `"${capitalize(weakWord)}" is vague and reduces the precision of your statement.`,
            suggestedReplacement: WEAK_WORDS[weakWord],
          });
        }
      }
      searchFrom = idx + weakWord.length;
    }
  }

  // Check weak transitions
  for (const [transition, suggestion] of Object.entries(WEAK_TRANSITIONS)) {
    let searchFrom = 0;
    while (true) {
      const idx = normalizedTranscript.indexOf(transition, searchFrom);
      if (idx === -1) break;

      const before = idx > 0 ? normalizedTranscript[idx - 1] : ' ';
      const after = idx + transition.length < normalizedTranscript.length
        ? normalizedTranscript[idx + transition.length]
        : ' ';

      if (/[\s,.'"]/.test(before) && /[\s,.'"]/.test(after)) {
        const alreadyCovered = occurrences.some(
          o => idx >= o.position && idx < o.position + o.word.length
        );

        if (!alreadyCovered) {
          const context = getContext(transcript, idx, transition.length);
          occurrences.push({
            word: transition,
            position: idx,
            context,
            explanation: `"${capitalize(transition)}" is a weak transition that doesn't guide the listener.`,
            suggestedReplacement: suggestion,
          });
        }
      }
      searchFrom = idx + transition.length;
    }
  }

  // Sort by position
  occurrences.sort((a, b) => a.position - b.position);

  return {
    totalCount: occurrences.length,
    occurrences,
  };
}

function getContext(transcript: string, position: number, wordLength: number): string {
  const contextChars = 50;
  const start = Math.max(0, position - contextChars);
  const end = Math.min(transcript.length, position + wordLength + contextChars);
  let context = transcript.substring(start, end).trim();
  if (start > 0) context = '...' + context;
  if (end < transcript.length) context += '...';
  return context;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
