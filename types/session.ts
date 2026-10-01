/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Session Types
   ═══════════════════════════════════════════════════════════════ */

import { SpeechAnalysis, RecoverySuggestion } from './speech';

export type TrainingMode = 'interview' | 'pressure' | 'opposite' | 'document';
export type DocumentSubMode = 'presentation' | 'interview';
export type SessionStatus = 'setup' | 'active' | 'paused' | 'analyzing' | 'completed' | 'error';

export interface SessionExchange {
  id: string;
  role: 'user' | 'ai';
  content: string;
  translatedContent?: string;
  speechAnalysis?: SpeechAnalysis;
  suggestions?: RecoverySuggestion[];
  timestamp: number;
  duration?: number;
}

export interface AIQuestion {
  id: string;
  text: string;
  context: string;
  targetingWeakness?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InterviewSessionData {
  topic: string;
  customTopic?: string;
  questions: AIQuestion[];
  exchanges: SessionExchange[];
}

export interface PressureSessionData {
  topic: string;
  prepTime: 5 | 10 | 15;
  speechDuration: number;
  exchanges: SessionExchange[];
}

export interface OppositeSessionData {
  topic: string;
  initialPosition: 'for' | 'against';
  switchTriggered: boolean;
  switchTimestamp?: number;
  exchanges: SessionExchange[];
}

export interface DocumentSessionData {
  subMode: DocumentSubMode;
  fileName: string;
  fileType: string;
  extractedContent: string;
  contentSummary: string;
  exchanges: SessionExchange[];
}

export type SessionData =
  | InterviewSessionData
  | PressureSessionData
  | OppositeSessionData
  | DocumentSessionData;

export interface Session {
  id: string;
  mode: TrainingMode;
  status: SessionStatus;
  data: SessionData;
  startTime: number;
  endTime?: number;
  report?: SessionReport;
}

export interface SessionReport {
  sessionId: string;
  mode: TrainingMode;
  overallScore: number;
  fluencyScore: number;
  clarityScore: number;
  pacingScore: number;
  relevanceScore: number;
  totalFillers: number;
  fillerBreakdown: Record<string, number>;
  fillerClusters: number;
  sentenceRestarts: number;
  vagueExplanations: number;
  totalFumbles: number;
  bestMoment: string;
  focusNextTime: string;
  positiveReinforcement: string;
  modeSpecificFeedback: string;
  aiSummary: string;
  strongAreas: string[];
  weakAreas: string[];
  improvementSuggestions: string[];
  timestamp: number;
}
