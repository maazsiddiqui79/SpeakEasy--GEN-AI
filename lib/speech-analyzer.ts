/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Speech Analyzer (Orchestrator)
   
   Combines all detection engines into a unified analysis pipeline:
   Transcript → Fillers + Fumbling + Weak Words + Pacing → Score → Suggestions
   ═══════════════════════════════════════════════════════════════ */

import { SpeechAnalysis, RecoverySuggestion } from '@/types/speech';
import { detectFillers, formatFillerCounts } from './filler-detector';
import { detectFumbling } from './fumbling-detector';
import { detectWeakWords } from './weak-word-detector';
import { analyzePacing } from './pacing-analyzer';
import {
  generateRecoverySuggestions,
  generatePositiveReinforcement,
  generateFocusArea,
} from './recovery-engine';
import { SCORE_THRESHOLDS } from './constants';

interface AnalyzeOptions {
  transcript: string;
  durationSeconds: number;
  pauseTimestamps?: Array<{ start: number; duration: number }>;
}

/**
 * Run the complete speech analysis pipeline
 */
export function analyzeSpeech(options: AnalyzeOptions): SpeechAnalysis {
  const { transcript, durationSeconds, pauseTimestamps = [] } = options;

  if (!transcript || transcript.trim().length === 0) {
    return createEmptyAnalysis(transcript);
  }

  // Run all detectors
  const fillers = detectFillers(transcript, durationSeconds);
  const fumbling = detectFumbling(transcript);
  const weakWords = detectWeakWords(transcript);
  const pacing = analyzePacing(transcript, durationSeconds, pauseTimestamps);

  // Calculate scores
  const fluencyScore = calculateFluencyScore(fillers, fumbling, pacing);
  const clarityScore = calculateClarityScore(weakWords, fumbling);
  const relevanceScore = 75; // Relevance requires AI context - set base, AI will adjust
  const overallScore = Math.round(
    fluencyScore * 0.35 +
    clarityScore * 0.30 +
    relevanceScore * 0.20 +
    (pacing.rating === 'optimal' ? 90 : pacing.rating === 'fast' || pacing.rating === 'slow' ? 70 : 50) * 0.15
  );

  return {
    transcript,
    fillers,
    fumbling,
    weakWords,
    pacing,
    overallScore: clamp(overallScore, 0, 100),
    fluencyScore: clamp(fluencyScore, 0, 100),
    clarityScore: clamp(clarityScore, 0, 100),
    relevanceScore,
    timestamp: Date.now(),
  };
}

/**
 * Get all recovery suggestions from an analysis
 */
export function getSuggestions(analysis: SpeechAnalysis): RecoverySuggestion[] {
  return generateRecoverySuggestions(
    analysis.fillers,
    analysis.fumbling,
    analysis.weakWords,
    analysis.pacing
  );
}

/**
 * Get positive reinforcement message
 */
export function getPositiveMessage(analysis: SpeechAnalysis): string {
  return generatePositiveReinforcement(
    analysis.fillers,
    analysis.fumbling,
    analysis.pacing,
    analysis.transcript.length
  );
}

/**
 * Get focus area recommendation
 */
export function getFocusMessage(analysis: SpeechAnalysis): string {
  return generateFocusArea(
    analysis.fillers,
    analysis.fumbling,
    analysis.weakWords,
    analysis.pacing
  );
}

/**
 * Get formatted filler counts string
 */
export function getFillerDisplay(analysis: SpeechAnalysis): string {
  return formatFillerCounts(analysis.fillers.wordCounts);
}

/* ── Score Calculation ── */

function calculateFluencyScore(
  fillers: ReturnType<typeof detectFillers>,
  fumbling: ReturnType<typeof detectFumbling>,
  pacing: ReturnType<typeof analyzePacing>
): number {
  let score = 100;

  // Filler penalty: -3 per filler, -8 per cluster
  score -= fillers.totalCount * 3;
  score -= fillers.clusters.length * 8;

  // Fumbling penalty: -10 per incident
  score -= fumbling.totalCount * 10;

  // Extra penalty for high-severity fumbling
  if (fumbling.severity === 'high') score -= 10;

  // Pacing penalty
  if (pacing.rating === 'too-slow' || pacing.rating === 'too-fast') score -= 15;
  else if (pacing.rating === 'slow' || pacing.rating === 'fast') score -= 7;

  // Pause penalty: -3 per long pause
  const longPauses = pacing.pauses.filter(p => p.type === 'long').length;
  score -= longPauses * 3;

  return Math.max(score, 0);
}

function calculateClarityScore(
  weakWords: ReturnType<typeof detectWeakWords>,
  fumbling: ReturnType<typeof detectFumbling>
): number {
  let score = 100;

  // Weak word penalty: -5 per occurrence
  score -= weakWords.totalCount * 5;

  // Fumbling impacts clarity too: -5 per self-correction, -3 per broken sentence
  for (const incident of fumbling.incidents) {
    if (incident.type === 'self-correction') score -= 5;
    if (incident.type === 'broken-sentence') score -= 3;
    if (incident.type === 'hesitation-phrase') score -= 4;
  }

  return Math.max(score, 0);
}

function createEmptyAnalysis(transcript: string): SpeechAnalysis {
  return {
    transcript: transcript || '',
    fillers: { totalCount: 0, wordCounts: {}, occurrences: [], clusters: [], density: 0 },
    fumbling: { totalCount: 0, incidents: [], severity: 'low' },
    weakWords: { totalCount: 0, occurrences: [] },
    pacing: { wordsPerMinute: 0, totalWords: 0, totalDuration: 0, pauses: [], rating: 'optimal' },
    overallScore: 0,
    fluencyScore: 0,
    clarityScore: 0,
    relevanceScore: 0,
    timestamp: Date.now(),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
