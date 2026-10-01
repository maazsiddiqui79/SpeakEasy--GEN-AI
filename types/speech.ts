/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Speech Analysis Types
   ═══════════════════════════════════════════════════════════════ */

/** Filler word occurrence with position info */
export interface FillerOccurrence {
  word: string;
  position: number;
  timestamp: number;
  surrounding: string;
}

/** Filler word analysis result */
export interface FillerAnalysis {
  totalCount: number;
  wordCounts: Record<string, number>;
  occurrences: FillerOccurrence[];
  clusters: FillerCluster[];
  density: number;
}

/** A cluster of fillers close together */
export interface FillerCluster {
  words: string[];
  startPosition: number;
  endPosition: number;
  surrounding: string;
}

/** Types of fumbling detected */
export type FumbleType =
  | 'sentence-restart'
  | 'repeated-word'
  | 'self-correction'
  | 'broken-sentence'
  | 'hesitation-phrase'
  | 'prolonged-uncertainty';

/** A single fumbling incident */
export interface FumbleIncident {
  type: FumbleType;
  problematicText: string;
  position: number;
  explanation: string;
  recoveryTechnique: string;
  suggestedAlternative: string;
}

/** Fumbling analysis result */
export interface FumblingAnalysis {
  totalCount: number;
  incidents: FumbleIncident[];
  severity: 'low' | 'moderate' | 'high';
}

/** Weak/vague word occurrence */
export interface WeakWordOccurrence {
  word: string;
  position: number;
  context: string;
  explanation: string;
  suggestedReplacement: string;
}

/** Weak word analysis */
export interface WeakWordAnalysis {
  totalCount: number;
  occurrences: WeakWordOccurrence[];
}

/** Pacing metrics */
export interface PacingAnalysis {
  wordsPerMinute: number;
  totalWords: number;
  totalDuration: number;
  pauses: PauseEvent[];
  rating: 'too-slow' | 'slow' | 'optimal' | 'fast' | 'too-fast';
}

/** A pause during speech */
export interface PauseEvent {
  startTime: number;
  duration: number;
  type: 'natural' | 'hesitation' | 'long';
}

/** Complete speech analysis combining all detectors */
export interface SpeechAnalysis {
  transcript: string;
  fillers: FillerAnalysis;
  fumbling: FumblingAnalysis;
  weakWords: WeakWordAnalysis;
  pacing: PacingAnalysis;
  overallScore: number;
  fluencyScore: number;
  clarityScore: number;
  relevanceScore: number;
  timestamp: number;
}

/** Recovery suggestion shown to user */
export interface RecoverySuggestion {
  type: 'filler' | 'fumbling' | 'weak-word' | 'pacing' | 'transition' | 'explanation';
  problematicText: string;
  explanation: string;
  technique: string;
  suggestedPhrase: string;
  severity: 'info' | 'warning' | 'important';
}

/** Subtle real-time indicator (shown during speech) */
export interface SubtleIndicator {
  type: 'filler' | 'fumbling' | 'pace-warning';
  message: string;
  timestamp: number;
  duration: number;
}
