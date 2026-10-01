/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Recovery Engine
   
   Generates contextual recovery suggestions following the PRD's
   core principle: "Don't just tell users what they did wrong.
   Tell them what they could say instead."
   
   Pattern: Detect → Identify → Explain → Recover → Suggest
   ═══════════════════════════════════════════════════════════════ */

import { RecoverySuggestion } from '@/types/speech';
import { FillerAnalysis, FumblingAnalysis, WeakWordAnalysis, PacingAnalysis } from '@/types/speech';

/**
 * Generate recovery suggestions from all analysis results
 * Prioritizes critical corrections over minor ones per PRD
 */
export function generateRecoverySuggestions(
  fillers: FillerAnalysis,
  fumbling: FumblingAnalysis,
  weakWords: WeakWordAnalysis,
  pacing: PacingAnalysis
): RecoverySuggestion[] {
  const suggestions: RecoverySuggestion[] = [];

  // 1. Fumbling suggestions (highest priority)
  for (const incident of fumbling.incidents) {
    suggestions.push({
      type: 'fumbling',
      problematicText: incident.problematicText,
      explanation: incident.explanation,
      technique: incident.recoveryTechnique,
      suggestedPhrase: incident.suggestedAlternative,
      severity: 'important',
    });
  }

  // 2. Filler cluster suggestions (high priority — clusters are worse than isolated)
  for (const cluster of fillers.clusters) {
    suggestions.push({
      type: 'filler',
      problematicText: cluster.surrounding,
      explanation: `Multiple filler words close together (${cluster.words.join(', ')}) signal uncertainty. Clusters are more distracting than isolated fillers.`,
      technique: 'Replace filler clusters with a brief, deliberate pause. Silence is more powerful than "um".',
      suggestedPhrase: removeFillers(cluster.surrounding, cluster.words),
      severity: 'warning',
    });
  }

  // 3. High-frequency fillers (if a specific word appears many times)
  const highFreqFillers = Object.entries(fillers.wordCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  for (const [word, count] of highFreqFillers) {
    suggestions.push({
      type: 'filler',
      problematicText: `"${word}" used ${count} times`,
      explanation: `You used "${word}" ${count} times in this response. Repeated fillers become noticeable to listeners.`,
      technique: getFillerRecoveryTechnique(word),
      suggestedPhrase: getFillerAlternative(word),
      severity: count >= 5 ? 'important' : 'warning',
    });
  }

  // 4. Weak word suggestions
  for (const occ of weakWords.occurrences) {
    suggestions.push({
      type: 'weak-word',
      problematicText: occ.context,
      explanation: occ.explanation,
      technique: 'Replace vague words with specific, descriptive language.',
      suggestedPhrase: occ.suggestedReplacement,
      severity: 'info',
    });
  }

  // 5. Pacing suggestions (if out of range)
  if (pacing.rating !== 'optimal') {
    suggestions.push({
      type: 'pacing',
      problematicText: `${pacing.wordsPerMinute} words per minute`,
      explanation: getPacingExplanation(pacing),
      technique: getPacingTechnique(pacing),
      suggestedPhrase: getPacingSuggestion(pacing),
      severity: pacing.rating === 'too-slow' || pacing.rating === 'too-fast' ? 'warning' : 'info',
    });
  }

  // Sort by severity: important → warning → info
  const severityOrder = { important: 0, warning: 1, info: 2 };
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return suggestions;
}

/**
 * Generate a brief "what went well" message (positive reinforcement)
 * PRD: "Every session must contain one thing the user did well"
 */
export function generatePositiveReinforcement(
  fillers: FillerAnalysis,
  fumbling: FumblingAnalysis,
  pacing: PacingAnalysis,
  transcriptLength: number
): string {
  const positives: string[] = [];

  if (fillers.totalCount === 0) {
    positives.push('🔥 No filler words detected — clean, confident delivery!');
  } else if (fillers.totalCount <= 2 && fillers.clusters.length === 0) {
    positives.push('👍 Very few filler words, and no clusters — good control.');
  }

  if (fumbling.totalCount === 0) {
    positives.push('🎯 Smooth delivery with no fumbling or restarts.');
  } else if (fumbling.incidents.some(i => i.type === 'sentence-restart')) {
    // Check if they recovered well after a restart
    positives.push('🔥 Nice recovery! You restarted cleanly after a fumble.');
  }

  if (pacing.rating === 'optimal') {
    positives.push('⚡ Excellent pacing — your speaking rate was clear and engaging.');
  }

  if (transcriptLength > 200) {
    positives.push('💪 You provided a detailed, thorough response.');
  }

  // Return the most relevant positive, or a generic one
  if (positives.length === 0) {
    return '👏 You completed the response — keep practicing for smoother delivery.';
  }

  return positives[0];
}

/**
 * Generate the "focus next time" suggestion
 * PRD: "Every session must contain one specific thing to practice next"
 */
export function generateFocusArea(
  fillers: FillerAnalysis,
  fumbling: FumblingAnalysis,
  weakWords: WeakWordAnalysis,
  pacing: PacingAnalysis
): string {
  // Priority order: fumbling > filler clusters > high filler count > pacing > weak words

  if (fumbling.severity === 'high') {
    return '🎯 Focus: Practice completing sentences without restarting. Use shorter, simpler sentences when explaining complex ideas.';
  }

  if (fillers.clusters.length > 0) {
    return '🎯 Focus: Work on eliminating filler word clusters. When you feel a filler coming, pause silently for 1 second instead.';
  }

  if (fillers.totalCount >= 5) {
    const topFiller = Object.entries(fillers.wordCounts)
      .sort((a, b) => b[1] - a[1])[0];
    return `🎯 Focus: Reduce "${topFiller[0]}" usage (${topFiller[1]} times). Practice pausing instead of filling silence.`;
  }

  if (pacing.rating === 'too-fast' || pacing.rating === 'too-slow') {
    return `🎯 Focus: Adjust your speaking pace (currently ${pacing.wordsPerMinute} WPM). Aim for 120-160 WPM for clear, engaging delivery.`;
  }

  if (weakWords.totalCount > 0) {
    return '🎯 Focus: Replace vague words ("things", "stuff") with specific terms. Before speaking, identify the 2-3 key nouns you need.';
  }

  return '🎯 Focus: Keep practicing! Try to make your points in fewer words while maintaining clarity.';
}

/* ── Helper Functions ── */

function getFillerRecoveryTechnique(word: string): string {
  const techniques: Record<string, string> = {
    'um': 'Replace with a silent pause. Silence feels longer to you than to the listener.',
    'uh': 'Replace with a silent pause. Take a breath before your next word.',
    'like': 'Remove it entirely — it almost never adds meaning.',
    'basically': 'Remove it. Go directly to your explanation.',
    'actually': 'Remove it unless you are genuinely correcting a misconception.',
    'you know': 'Remove it. The listener is waiting for your explanation, not agreement.',
    'so': 'At the start of a response, remove it. Begin with your main point.',
    'i mean': 'Replace with a brief pause, then state what you actually mean.',
    'kind of': 'Remove the hedging. State your point directly.',
    'sort of': 'Remove the hedging. Be definitive.',
  };
  return techniques[word] || 'Replace with a deliberate pause.';
}

function getFillerAlternative(word: string): string {
  const alternatives: Record<string, string> = {
    'um': '[pause]',
    'uh': '[pause]',
    'like': '[remove]',
    'basically': '[remove — go straight to the explanation]',
    'actually': '[remove unless correcting]',
    'you know': '[remove]',
    'so': '[begin with your main point]',
    'i mean': '[pause, then say what you mean]',
    'kind of': '[state definitively]',
    'sort of': '[state definitively]',
  };
  return alternatives[word] || '[pause instead]';
}

function removeFillers(text: string, fillers: string[]): string {
  let cleaned = text;
  for (const filler of fillers) {
    const regex = new RegExp(`\\b${filler}\\b[,\\s]*`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.replace(/\s+/g, ' ').trim() || text;
}

function getPacingExplanation(pacing: PacingAnalysis): string {
  const explanations: Record<PacingAnalysis['rating'], string> = {
    'too-slow': 'Speaking very slowly can lose the listener\'s attention and signal uncertainty.',
    'slow': 'A slightly slow pace may indicate over-thinking or hesitation.',
    'optimal': 'Great pace!',
    'fast': 'Speaking quickly can make it harder for listeners to follow complex points.',
    'too-fast': 'Speaking very fast signals nervousness and makes key points easy to miss.',
  };
  return explanations[pacing.rating];
}

function getPacingTechnique(pacing: PacingAnalysis): string {
  if (pacing.rating === 'too-slow' || pacing.rating === 'slow') {
    return 'Practice speaking with more energy. Reduce internal processing pauses by preparing key points mentally before speaking.';
  }
  return 'Breathe between sentences. Slow down deliberately on key points, then resume normal pace.';
}

function getPacingSuggestion(pacing: PacingAnalysis): string {
  if (pacing.rating === 'too-slow' || pacing.rating === 'slow') {
    return 'Try practicing with a 120 WPM target. Read aloud at this pace to build muscle memory.';
  }
  return 'Mark 2-3 key points in your response where you deliberately slow down for emphasis.';
}
