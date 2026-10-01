/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Filler Word Detector
   
   Detects filler words in transcripts, counts per-word,
   identifies clusters, and calculates density.
   ═══════════════════════════════════════════════════════════════ */

import {
  FillerAnalysis,
  FillerOccurrence,
  FillerCluster,
} from '@/types/speech';
import {
  FILLER_WORDS,
  MULTI_WORD_FILLERS,
  FILLER_CLUSTER_DISTANCE,
} from './constants';

/**
 * Analyze a transcript for filler words
 * 
 * @param transcript - The speech transcript to analyze
 * @param durationSeconds - Total speech duration for density calculation
 * @returns FillerAnalysis with counts, occurrences, clusters, and density
 */
export function detectFillers(
  transcript: string,
  durationSeconds: number
): FillerAnalysis {
  const normalizedTranscript = transcript.toLowerCase();
  const occurrences: FillerOccurrence[] = [];

  // First pass: detect multi-word fillers (before splitting into words)
  for (const phrase of MULTI_WORD_FILLERS) {
    let searchFrom = 0;
    while (true) {
      const idx = normalizedTranscript.indexOf(phrase, searchFrom);
      if (idx === -1) break;

      // Check it's a word boundary (not part of a larger word)
      const before = idx > 0 ? normalizedTranscript[idx - 1] : ' ';
      const after = idx + phrase.length < normalizedTranscript.length
        ? normalizedTranscript[idx + phrase.length]
        : ' ';

      if (/[\s,.]/.test(before) && /[\s,.]/.test(after)) {
        const surrounding = getSurroundingContext(transcript, idx, phrase.length);
        occurrences.push({
          word: phrase,
          position: idx,
          timestamp: estimateTimestamp(idx, transcript.length, durationSeconds),
          surrounding,
        });
      }
      searchFrom = idx + phrase.length;
    }
  }

  // Second pass: detect single-word fillers
  const singleWordFillers = FILLER_WORDS.filter(f => !f.includes(' '));
  const words = normalizedTranscript.split(/\s+/);
  let charOffset = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z']/g, '');

    if (singleWordFillers.includes(cleanWord)) {
      // Check we haven't already caught this as part of a multi-word filler
      const alreadyCaught = occurrences.some(
        o => o.position <= charOffset && charOffset < o.position + o.word.length + 5
      );

      if (!alreadyCaught) {
        const surrounding = getSurroundingContext(transcript, charOffset, cleanWord.length);
        occurrences.push({
          word: cleanWord,
          position: charOffset,
          timestamp: estimateTimestamp(charOffset, transcript.length, durationSeconds),
          surrounding,
        });
      }
    }
    charOffset += word.length + 1;
  }

  // Sort by position
  occurrences.sort((a, b) => a.position - b.position);

  // Count per word
  const wordCounts: Record<string, number> = {};
  for (const occ of occurrences) {
    wordCounts[occ.word] = (wordCounts[occ.word] || 0) + 1;
  }

  // Detect clusters (fillers within FILLER_CLUSTER_DISTANCE words of each other)
  const clusters = detectClusters(occurrences, transcript);

  // Calculate density (fillers per minute)
  const durationMinutes = Math.max(durationSeconds / 60, 0.1); // avoid division by zero
  const density = occurrences.length / durationMinutes;

  return {
    totalCount: occurrences.length,
    wordCounts,
    occurrences,
    clusters,
    density: Math.round(density * 10) / 10,
  };
}

/**
 * Detect clusters of fillers that are close together.
 * Clusters are more problematic than isolated fillers.
 */
function detectClusters(
  occurrences: FillerOccurrence[],
  transcript: string
): FillerCluster[] {
  if (occurrences.length < 2) return [];

  const clusters: FillerCluster[] = [];
  let clusterStart = 0;
  let currentCluster: FillerOccurrence[] = [occurrences[0]];

  for (let i = 1; i < occurrences.length; i++) {
    const wordsBetween = countWordsBetween(
      transcript,
      occurrences[i - 1].position + occurrences[i - 1].word.length,
      occurrences[i].position
    );

    if (wordsBetween <= FILLER_CLUSTER_DISTANCE) {
      currentCluster.push(occurrences[i]);
    } else {
      if (currentCluster.length >= 2) {
        clusters.push(buildCluster(currentCluster, transcript));
      }
      currentCluster = [occurrences[i]];
      clusterStart = i;
    }
  }

  // Don't forget the last cluster
  if (currentCluster.length >= 2) {
    clusters.push(buildCluster(currentCluster, transcript));
  }

  return clusters;
}

function buildCluster(
  occurrences: FillerOccurrence[],
  transcript: string
): FillerCluster {
  const startPos = occurrences[0].position;
  const lastOcc = occurrences[occurrences.length - 1];
  const endPos = lastOcc.position + lastOcc.word.length;

  return {
    words: occurrences.map(o => o.word),
    startPosition: startPos,
    endPosition: endPos,
    surrounding: transcript.substring(
      Math.max(0, startPos - 20),
      Math.min(transcript.length, endPos + 20)
    ).trim(),
  };
}

/**
 * Get surrounding text context for a filler occurrence
 */
function getSurroundingContext(
  transcript: string,
  position: number,
  wordLength: number,
  contextChars: number = 40
): string {
  const start = Math.max(0, position - contextChars);
  const end = Math.min(transcript.length, position + wordLength + contextChars);
  let context = transcript.substring(start, end).trim();

  if (start > 0) context = '...' + context;
  if (end < transcript.length) context = context + '...';

  return context;
}

/**
 * Estimate timestamp based on position in transcript
 */
function estimateTimestamp(
  charPosition: number,
  totalChars: number,
  totalDuration: number
): number {
  if (totalChars === 0) return 0;
  return Math.round((charPosition / totalChars) * totalDuration * 10) / 10;
}

/**
 * Count words between two character positions
 */
function countWordsBetween(
  transcript: string,
  startPos: number,
  endPos: number
): number {
  const between = transcript.substring(startPos, endPos).trim();
  if (!between) return 0;
  return between.split(/\s+/).length;
}

/**
 * Format filler counts for display
 * e.g., "Um: 4 | Like: 2 | Basically: 1"
 */
export function formatFillerCounts(
  wordCounts: Record<string, number>
): string {
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => `${capitalize(word)}: ${count}`)
    .join('  |  ');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
