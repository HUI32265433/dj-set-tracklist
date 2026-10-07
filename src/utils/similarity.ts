import { normalize, stripDecorations } from './normalize';
import type { TrackCandidate } from '../types/track';

/** Levenshtein distance (iterative, O(min) memory). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length > b.length) [a, b] = [b, a];
  const prev = new Array<number>(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;
  for (let j = 1; j <= b.length; j++) {
    let last = prev[0];
    prev[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = prev[i];
      prev[i] = Math.min(prev[i] + 1, prev[i - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = cur;
    }
  }
  return prev[a.length];
}

/** 0..1 similarity between two strings after normalization. */
export function stringSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const lev = 1 - dist / Math.max(na.length, nb.length);
  // token inclusion bonus (handles "Tiny Tiny / 水色のFantasy" vs "Tiny Tiny")
  const ta = new Set(na.split(' '));
  const tb = new Set(nb.split(' '));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const jaccard = inter / Math.max(ta.size, tb.size, 1);
  const contains = na.includes(nb) || nb.includes(na) ? 0.85 : 0;
  return Math.max(lev, jaccard * 0.9, contains);
}

const SOURCE_WEIGHT: Record<TrackCandidate['source'], number> = {
  itunes: 0.03,
  netease: 0.02,
  musicbrainz: 0.0,
};

/**
 * Confidence that `candidate` is the track the user asked for.
 * ≥ 0.85  auto-accept  |  0.55–0.85  needs confirmation  |  < 0.55  reject
 */
export function computeConfidence(
  queryTitle: string,
  queryArtist: string | undefined,
  candidate: Omit<TrackCandidate, 'confidence'>,
): number {
  const fullTitle = stringSimilarity(queryTitle, candidate.title);
  const baseTitle = stringSimilarity(stripDecorations(queryTitle), stripDecorations(candidate.title));
  const titleScore = Math.max(fullTitle, baseTitle * 0.96);

  let score = titleScore * 0.82;

  if (queryArtist) {
    const artistScore = stringSimilarity(queryArtist, candidate.artist);
    score += artistScore * 0.16;
  } else {
    score += titleScore * 0.16; // no artist info: re-weight onto title
  }

  if (normalize(queryTitle) === normalize(candidate.title)) score = Math.max(score, 0.97);
  score += SOURCE_WEIGHT[candidate.source];

  return Math.min(1, Math.round(score * 100) / 100);
}

export const CONFIDENCE_AUTO = 0.85;
export const CONFIDENCE_CONFIRM = 0.55;

export function confidenceLabel(c: number): string {
  if (c >= CONFIDENCE_AUTO) return 'HIGH MATCH';
  if (c >= CONFIDENCE_CONFIRM) return 'NEEDS CHECK';
  return 'LOW MATCH';
}
