/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Constants
   Filler words, thresholds, and configuration values
   ═══════════════════════════════════════════════════════════════ */

/**
 * Common filler words/phrases to detect
 * Per PRD: "um", "uh", "like", "basically", "actually",
 *          "you know", "so", "I mean", "kind of", "sort of"
 */
export const FILLER_WORDS: string[] = [
  'um', 'uh', 'uhh', 'umm', 'hmm',
  'like',
  'basically',
  'actually',
  'you know',
  'so',
  'i mean',
  'kind of',
  'sort of',
  'right',
  'okay so',
  'well',
  'literally',
  'honestly',
];

/**
 * Multi-word fillers that need phrase-level matching
 */
export const MULTI_WORD_FILLERS: string[] = [
  'you know',
  'i mean',
  'kind of',
  'sort of',
  'okay so',
  'i guess',
  'to be honest',
  'at the end of the day',
];

/**
 * Weak/vague words that reduce clarity
 * Per PRD: "things", "stuff", "many things"
 */
export const WEAK_WORDS: Record<string, string> = {
  'things': 'Use a specific noun (e.g., "features", "components", "aspects")',
  'stuff': 'Use a specific noun (e.g., "tools", "techniques", "data")',
  'many things': 'Be specific about quantity and items (e.g., "three main features")',
  'a lot of': 'Specify the quantity or use "significant" / "substantial"',
  'very': 'Use a stronger adjective (e.g., "exceptional" instead of "very good")',
  'really': 'Remove or use a precise adjective',
  'good': 'Be more specific (e.g., "efficient", "reliable", "user-friendly")',
  'bad': 'Be more specific (e.g., "inefficient", "unreliable", "error-prone")',
  'nice': 'Use a more descriptive word (e.g., "well-designed", "intuitive")',
  'big': 'Specify scale (e.g., "enterprise-scale", "high-volume")',
  'small': 'Specify scale (e.g., "lightweight", "minimal")',
  'easy': 'Be specific (e.g., "straightforward to implement", "requires minimal configuration")',
  'hard': 'Be specific (e.g., "resource-intensive", "complex to maintain")',
  'get': 'Use a more precise verb (e.g., "retrieve", "obtain", "acquire")',
  'do': 'Use a more precise verb (e.g., "execute", "perform", "implement")',
  'make': 'Use a more precise verb (e.g., "create", "generate", "construct")',
};

/**
 * Weak transition phrases
 */
export const WEAK_TRANSITIONS: Record<string, string> = {
  'and then': 'Use "Next, ..." or "Subsequently, ..."',
  'and also': 'Use "Additionally, ..." or "Furthermore, ..."',
  'but': 'Use "However, ..." for formal contexts',
  'so yeah': 'Remove or use "In summary, ..."',
  'anyway': 'Use "Moving on, ..." or "To continue, ..."',
};

/**
 * Hesitation/fumbling trigger phrases
 */
export const FUMBLING_PATTERNS: RegExp[] = [
  // Sentence restarts: "The main... the main reason"
  /\b(\w+(?:\s+\w+){0,3})\s*\.{2,}\s*\1\b/gi,
  // Self-corrections: "actually, what I mean is"
  /actually,?\s*what\s+i\s+mean/gi,
  // Broken sentences with ellipsis-like patterns
  /\b(\w+)\s+\1\s+\1\b/gi,  // triple repeated word
  /\b(\w+)\s+\1\b/gi,       // double repeated word (excluding intentional)
  // Hesitation phrases
  /\bi\s+don'?t\s+know\s+how\s+to\s+(explain|say|put)/gi,
  /\bwhat\s+i('m)?\s+trying\s+to\s+say/gi,
  /\blet\s+me\s+start\s+over\b/gi,
  /\bwait,?\s*(no|actually)\b/gi,
];

/**
 * Pacing thresholds (words per minute)
 */
export const PACING = {
  TOO_SLOW: 80,
  SLOW: 110,
  OPTIMAL_MIN: 120,
  OPTIMAL_MAX: 160,
  FAST: 170,
  TOO_FAST: 200,
} as const;

/**
 * Pause thresholds (seconds)
 */
export const PAUSE_THRESHOLDS = {
  NATURAL: 0.5,         // Normal pause
  HESITATION: 2.0,      // Noticeable pause
  LONG: 4.0,            // Prolonged pause
} as const;

/**
 * Filler cluster: fillers within this word distance are clustered
 */
export const FILLER_CLUSTER_DISTANCE = 15; // words

/**
 * Score thresholds
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 50,
  NEEDS_WORK: 30,
} as const;

/**
 * Default voice recognition config
 */
export const DEFAULT_VOICE_CONFIG = {
  language: 'en-US',
  continuous: true,
  interimResults: true,
} as const;

/**
 * Interview topics for dynamic generation
 */
export const INTERVIEW_CATEGORIES = [
  'Software Engineering',
  'Data Science',
  'Product Management',
  'Marketing',
  'Finance',
  'Behavioral',
  'System Design',
  'Leadership',
  'Problem Solving',
  'General Knowledge',
] as const;

/**
 * Pressure mode topic categories
 */
export const PRESSURE_CATEGORIES = [
  'Technology',
  'Society',
  'Business',
  'Education',
  'Environment',
  'Philosophy',
  'Ethics',
  'Innovation',
  'Current Events',
  'Personal Growth',
] as const;
