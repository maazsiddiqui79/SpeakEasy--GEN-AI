/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Pacing Analyzer
   
   Measures words per minute, detects pauses,
   and rates overall speaking pace.
   ═══════════════════════════════════════════════════════════════ */

import { PacingAnalysis, PauseEvent } from '@/types/speech';
import { PACING, PAUSE_THRESHOLDS } from './constants';

/**
 * Analyze speaking pace from transcript and timing data
 * 
 * @param transcript - Full transcript text
 * @param durationSeconds - Total speaking duration
 * @param pauseTimestamps - Optional array of detected pause timestamps and durations
 */
export function analyzePacing(
  transcript: string,
  durationSeconds: number,
  pauseTimestamps: Array<{ start: number; duration: number }> = []
): PacingAnalysis {
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  // Calculate WPM
  const durationMinutes = Math.max(durationSeconds / 60, 0.01);
  const wordsPerMinute = Math.round(totalWords / durationMinutes);

  // Classify pauses
  const pauses: PauseEvent[] = pauseTimestamps.map(p => ({
    startTime: p.start,
    duration: p.duration,
    type: p.duration >= PAUSE_THRESHOLDS.LONG
      ? 'long'
      : p.duration >= PAUSE_THRESHOLDS.HESITATION
        ? 'hesitation'
        : 'natural',
  }));

  // Rate pacing
  const rating = ratePacing(wordsPerMinute);

  return {
    wordsPerMinute,
    totalWords,
    totalDuration: durationSeconds,
    pauses,
    rating,
  };
}

/**
 * Rate pacing based on WPM thresholds
 */
function ratePacing(wpm: number): PacingAnalysis['rating'] {
  if (wpm < PACING.TOO_SLOW) return 'too-slow';
  if (wpm < PACING.SLOW) return 'slow';
  if (wpm <= PACING.OPTIMAL_MAX) return 'optimal';
  if (wpm <= PACING.TOO_FAST) return 'fast';
  return 'too-fast';
}

/**
 * Get a human-readable pacing description
 */
export function getPacingFeedback(analysis: PacingAnalysis): string {
  const { wordsPerMinute, rating, pauses } = analysis;

  const ratingMessages: Record<PacingAnalysis['rating'], string> = {
    'too-slow': `Your pace was ${wordsPerMinute} WPM — quite slow. Try to maintain a conversational pace of 120-160 WPM. Practice speaking at a slightly faster, more energetic rate.`,
    'slow': `Your pace was ${wordsPerMinute} WPM — slightly below average. A pace of 120-160 WPM feels most natural to listeners.`,
    'optimal': `Your pace was ${wordsPerMinute} WPM — excellent! This is a clear, conversational rate that keeps listeners engaged.`,
    'fast': `Your pace was ${wordsPerMinute} WPM — a bit fast. Slow down slightly so listeners can follow complex points. Aim for 120-160 WPM.`,
    'too-fast': `Your pace was ${wordsPerMinute} WPM — too fast for most listeners. Slow down significantly, especially during key points. Use deliberate pauses between ideas.`,
  };

  let feedback = ratingMessages[rating];

  // Add pause feedback
  const longPauses = pauses.filter(p => p.type === 'long');
  const hesitations = pauses.filter(p => p.type === 'hesitation');

  if (longPauses.length > 0) {
    feedback += ` You had ${longPauses.length} extended pause${longPauses.length > 1 ? 's' : ''} (4+ seconds).`;
  }
  if (hesitations.length > 2) {
    feedback += ` You had ${hesitations.length} noticeable hesitations.`;
  }

  return feedback;
}
