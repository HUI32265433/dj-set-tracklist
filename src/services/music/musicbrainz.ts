import type { MusicProvider } from './types';
import { ProviderError } from './types';
import type { TrackCandidate } from '../../types/track';

/**
 * MusicBrainz enforces a strict ~1 request/second limit (503 on violation),
 * so every call goes through a serialized queue with a 1.1s gap.
 */
const GAP_MS = 1100;
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const result = await fn();
    await new Promise((r) => setTimeout(r, GAP_MS));
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}

interface MBRecording {
  id: string;
  title: string;
  'artist-credit'?: { name: string }[];
  releases?: { id: string; title: string; date?: string }[];
  tags?: { name: string; count: number }[];
}

interface MBResponse {
  recordings?: MBRecording[];
}

/** Cover Art Archive redirect endpoint — usable directly in <img>, CORS-friendly. */
function caaFront(releaseMbid: string, size: 250 | 500 = 500): string {
  return `https://coverartarchive.org/release/${releaseMbid}/front-${size}`;
}

export const musicBrainzProvider: MusicProvider = {
  name: 'musicbrainz',
  search(query) {
    return enqueue(async () => {
      const parts = [`recording:"${query.title.replace(/"/g, '\\"')}"`];
      if (query.artist) parts.push(`AND artist:"${query.artist.replace(/"/g, '\\"')}"`);
      const url =
        'https://musicbrainz.org/ws/2/recording/?query=' +
        encodeURIComponent(parts.join(' ')) +
        '&fmt=json&limit=8';
      let res: Response;
      try {
        res = await fetch(url, { headers: { Accept: 'application/json' } });
      } catch {
        throw new ProviderError('Network error', 'musicbrainz', 'network');
      }
      if (res.status === 503 || res.status === 429) {
        throw new ProviderError('Too many requests', 'musicbrainz', 'ratelimit');
      }
      if (!res.ok) throw new ProviderError(`HTTP ${res.status}`, 'musicbrainz', 'network');
      const data = (await res.json()) as MBResponse;

      return (data.recordings ?? []).map((rec): Omit<TrackCandidate, 'confidence'> => {
        const release = rec.releases?.[0];
        return {
          id: `mb-${rec.id}`,
          title: rec.title,
          artist: rec['artist-credit']?.map((a) => a.name).join('') ?? '',
          album: release?.title ?? '',
          coverUrl: release ? caaFront(release.id, 500) : undefined,
          releaseDate: release?.date,
          genre: rec.tags?.sort((a, b) => b.count - a.count)[0]?.name,
          source: 'musicbrainz',
          sourceId: rec.id,
        };
      });
    });
  },
};
