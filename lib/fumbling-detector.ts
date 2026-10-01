/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Fumbling Detector
   
   Detects sentence restarts, repeated words, self-corrections,
   broken sentences, hesitation phrases, and provides
   recovery suggestions (not just detection).
   
   PRD: "Don't just detect. Identify → Explain → Recover → Suggest."
   ═══════════════════════════════════════════════════════════════ */

import {
  FumblingAnalysis,
  FumbleIncident,
  FumbleType,
} from '@/types/speech';

/**
 * Analyze a transcript for fumbling incidents
 * Returns not just detection, but explanation + recovery + alternative
 */
export function detectFumbling(transcript: string): FumblingAnalysis {
  const incidents: FumbleIncident[] = [];

  // 1. Detect sentence restarts
  incidents.push(...detectSentenceRestarts(transcript));

  // 2. Detect repeated words (non-intentional)
  incidents.push(...detectRepeatedWords(transcript));

  // 3. Detect self-corrections
  incidents.push(...detectSelfCorrections(transcript));

  // 4. Detect broken/incomplete sentences
  incidents.push(...detectBrokenSentences(transcript));

  // 5. Detect hesitation phrases
  incidents.push(...detectHesitationPhrases(transcript));

  // Sort by position
  incidents.sort((a, b) => a.position - b.position);

  // Remove duplicates (overlapping detections)
  const deduped = deduplicateIncidents(incidents);

  // Determine severity
  const severity = deduped.length === 0
    ? 'low'
    : deduped.length <= 2
      ? 'moderate'
      : 'high';

  return {
    totalCount: deduped.length,
    incidents: deduped,
    severity,
  };
}

/**
 * Detect sentence restarts: "The main... the main reason"
 */
function detectSentenceRestarts(transcript: string): FumbleIncident[] {
  const incidents: FumbleIncident[] = [];
  const normalized = transcript.toLowerCase();

  // Pattern: repeated phrase start with interruption
  // "The main reason... actually... the main reason is..."
  const restartPattern = /\b((?:\w+\s+){1,4})\s*(?:\.{2,}|,\s*(?:uh|um|like|actually|wait)\s*,?\s*)\s*\1/gi;

  let match;
  while ((match = restartPattern.exec(normalized)) !== null) {
    const phrase = match[1].trim();
    incidents.push({
      type: 'sentence-restart',
      problematicText: match[0],
      position: match.index,
      explanation: `You restarted the sentence "${phrase}..." — this signals uncertainty to the listener.`,
      recoveryTechnique: 'Pause → Breathe → Restart with a shorter, complete sentence.',
      suggestedAlternative: `${capitalize(phrase.trim())}...`,
    });
  }

  return incidents;
}

/**
 * Detect repeated words: "the the", "I I", "basically basically"
 */
function detectRepeatedWords(transcript: string): FumbleIncident[] {
  const incidents: FumbleIncident[] = [];
  const normalized = transcript.toLowerCase();

  // Exclude intentional repetitions like "very very" (sometimes intentional)
  const intentionalRepeats = new Set(['very', 'no', 'yes', 'yeah', 'so']);

  const repeatPattern = /\b(\w{2,})\s+\1\b/gi;
  let match;

  while ((match = repeatPattern.exec(normalized)) !== null) {
    const word = match[1].toLowerCase();

    if (intentionalRepeats.has(word)) continue;

    incidents.push({
      type: 'repeated-word',
      problematicText: match[0],
      position: match.index,
      explanation: `You repeated "${word}" — this can sound like hesitation.`,
      recoveryTechnique: 'If you catch yourself repeating, simply continue with the rest of the sentence.',
      suggestedAlternative: word,
    });
  }

  return incidents;
}

/**
 * Detect self-corrections: "actually, what I mean is..."
 */
function detectSelfCorrections(transcript: string): FumbleIncident[] {
  const incidents: FumbleIncident[] = [];
  const normalized = transcript.toLowerCase();

  const selfCorrectionPatterns: Array<{ pattern: RegExp; explanation: string }> = [
    {
      pattern: /actually,?\s*what\s+i\s+mean\s+is/gi,
      explanation: 'Self-correcting with "actually, what I mean is..." lengthens the response and signals confusion.',
    },
    {
      pattern: /wait,?\s*(no|actually|let\s+me)/gi,
      explanation: 'Stopping mid-thought with "wait" draws attention to the error.',
    },
    {
      pattern: /i\s+mean,?\s*not\s+that,?\s*but/gi,
      explanation: 'Double-correcting weakens your point.',
    },
    {
      pattern: /sorry,?\s*(i\s+meant|let\s+me\s+rephrase)/gi,
      explanation: 'Over-apologizing for word choices makes you sound less confident.',
    },
    {
      pattern: /no,?\s*(that'?s\s+not|i\s+didn'?t\s+mean)/gi,
      explanation: 'Negating your own statement confuses the listener.',
    },
  ];

  for (const { pattern, explanation } of selfCorrectionPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(normalized)) !== null) {
      incidents.push({
        type: 'self-correction',
        problematicText: match[0],
        position: match.index,
        explanation,
        recoveryTechnique: 'Instead of correcting mid-sentence, finish your current thought, then add the correction as a new sentence.',
        suggestedAlternative: 'To clarify, ...',
      });
    }
  }

  return incidents;
}

/**
 * Detect broken/incomplete sentences
 */
function detectBrokenSentences(transcript: string): FumbleIncident[] {
  const incidents: FumbleIncident[] = [];

  // Look for sentences that trail off: "The system can... and then..."
  const trailOffPattern = /([A-Z][^.!?]*?)\s*\.{3,}\s*(?:and|but|so|or)\b/g;
  let match;

  while ((match = trailOffPattern.exec(transcript)) !== null) {
    incidents.push({
      type: 'broken-sentence',
      problematicText: match[0],
      position: match.index,
      explanation: 'Your sentence trailed off before reaching the main point.',
      recoveryTechnique: 'Complete the thought: Subject → Verb → Object. Keep sentences short.',
      suggestedAlternative: `${match[1].trim()}. [complete the thought]`,
    });
  }

  return incidents;
}

/**
 * Detect hesitation phrases
 */
function detectHesitationPhrases(transcript: string): FumbleIncident[] {
  const incidents: FumbleIncident[] = [];
  const normalized = transcript.toLowerCase();

  const hesitationPatterns: Array<{ pattern: RegExp; explanation: string; alternative: string }> = [
    {
      pattern: /i\s+don'?t\s+know\s+how\s+to\s+(explain|say|put\s+it)/gi,
      explanation: '"I don\'t know how to explain" tells the listener you\'re unsure before even trying.',
      alternative: 'In simple terms, ...',
    },
    {
      pattern: /what\s+i'?m?\s+trying\s+to\s+say\s+is/gi,
      explanation: '"What I\'m trying to say" adds unnecessary preamble.',
      alternative: 'My point is...',
    },
    {
      pattern: /let\s+me\s+(think|start\s+over|try\s+again)/gi,
      explanation: 'Announcing a restart can be replaced with just restarting cleanly.',
      alternative: '[Pause briefly, then restart clearly]',
    },
    {
      pattern: /i'?m?\s+not\s+sure\s+(if|how)\s+to/gi,
      explanation: 'Expressing doubt before answering undermines your response.',
      alternative: 'Based on my understanding, ...',
    },
    {
      pattern: /that'?s\s+a\s+(good|great|tough|hard)\s+question/gi,
      explanation: 'This is a common stalling phrase in interviews.',
      alternative: '[Pause for 1 second, then begin answering directly]',
    },
  ];

  for (const { pattern, explanation, alternative } of hesitationPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(normalized)) !== null) {
      incidents.push({
        type: 'hesitation-phrase',
        problematicText: match[0],
        position: match.index,
        explanation,
        recoveryTechnique: 'Replace the hesitation phrase with a brief pause, then lead with your actual answer.',
        suggestedAlternative: alternative,
      });
    }
  }

  return incidents;
}

/**
 * Remove overlapping incidents (keep the more specific one)
 */
function deduplicateIncidents(incidents: FumbleIncident[]): FumbleIncident[] {
  if (incidents.length <= 1) return incidents;

  const result: FumbleIncident[] = [incidents[0]];

  for (let i = 1; i < incidents.length; i++) {
    const prev = result[result.length - 1];
    const curr = incidents[i];

    // Check if positions overlap
    const prevEnd = prev.position + prev.problematicText.length;
    if (curr.position < prevEnd) {
      // Keep the more specific (longer detected text) one
      if (curr.problematicText.length > prev.problematicText.length) {
        result[result.length - 1] = curr;
      }
      // Otherwise keep prev (already in result)
    } else {
      result.push(curr);
    }
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
