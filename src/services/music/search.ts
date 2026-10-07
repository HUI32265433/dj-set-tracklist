import { itunesProvider } from './itunes';
import { musicBrainzProvider } from './musicbrainz';
import { createNetEaseProvider } from './netease';
import { ProviderError } from './types';
import { computeConfidence } from '../../utils/similarity';
import { parseBatchInput } from '../../utils/normalize';
import type { TrackCandidate } from '../../types/track';

export interface SearchOptions {
  neteaseProxyUrl?: string;
  /** Skip MusicBrainz fallback (used inside batch mode to respect the 1 req/s limit). */
  skipFallback?: boolean;
}

export interface SearchOutcome {
  candidates: TrackCandidate[];
  errors: { provider: string; kind: string; message: string }[];
}

/**
 * Unified metadata search:
 *   iTunes (fast, parallel storefronts) + optional NetEase proxy in parallel;
 *   MusicBrainz only as fallback when the fast lane finds nothing.
 */
export async function searchTracks(
  title: string,
  artist?: string,
  opts: SearchOptions = {},
): Promise<SearchOutcome> {
  const query = { title, artist };
  const errors: SearchOutcome['errors'] = [];

  const fast = await Promise.allSettled([
    itunesProvider.search(query),
    createNetEaseProvider(opts.neteaseProxyUrl ?? import.meta.env.VITE_NETEASE_PROXY_URL).search(query),
  ]);

  let raw: Omit<TrackCandidate, 'confidence'>[] = [];
  for (const r of fast) {
    if (r.status === 'fulfilled') raw.push(...r.value);
    else if (r.reason instanceof ProviderError && r.reason.kind !== 'disabled') {
      errors.push({ provider: r.reason.provider, kind: r.reason.kind, message: r.reason.message });
    }
  }

  if (raw.length === 0 && !opts.skipFallback) {
    try {
      raw = await musicBrainzProvider.search(query);
    } catch (e) {
      if (e instanceof ProviderError) errors.push({ provider: e.provider, kind: e.kind, message: e.message });
    }
  }

  const seen = new Set<string>();
  const candidates: TrackCandidate[] = [];
  for (const c of raw) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    candidates.push({ ...c, confidence: computeConfidence(title, artist, c) });
  }
  candidates.sort((a, b) => b.confidence - a.confidence);
  return { candidates: candidates.slice(0, 10), errors };
}

export type BatchLineStatus = 'matched' | 'confirm' | 'failed';
export interface BatchLineResult {
  title: string;
  artist?: string;
  status: BatchLineStatus;
  candidates: TrackCandidate[];
}

/** Batch search with limited concurrency; iTunes lane only (MB is too slow for batches). */
export async function searchBatch(
  rawInput: string,
  onProgress: (done: number, total: number) => void,
  opts: SearchOptions = {},
  concurrency = 3,
): Promise<BatchLineResult[]> {
  const queries = parseBatchInput(rawInput);
  const results: BatchLineResult[] = new Array(queries.length) as BatchLineResult[];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < queries.length) {
      const i = cursor++;
      const q = queries[i];
      try {
        const { candidates } = await searchTracks(q.title, q.artist, { ...opts, skipFallback: true });
        const top = candidates[0];
        results[i] = {
          title: q.title,
          artist: q.artist,
          candidates,
          status: !top || top.confidence < 0.55 ? 'failed' : top.confidence < 0.85 ? 'confirm' : 'matched',
        };
      } catch {
        results[i] = { title: q.title, artist: q.artist, candidates: [], status: 'failed' };
      }
      onProgress(++done, queries.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queries.length) }, worker));
  return results;
}
