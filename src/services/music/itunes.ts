import type { MusicProvider, SearchQuery } from './types';
import { ProviderError } from './types';
import type { TrackCandidate } from '../../types/track';
import { normalize } from '../../utils/normalize';

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesResult[];
}

const COUNTRY = import.meta.env.VITE_ITUNES_COUNTRY || 'JP';

/** Upgrade Apple's 100px artwork URL to a high-res variant. */
export function upscaleArtwork(url?: string, size = 600): string | undefined {
  if (!url) return undefined;
  return url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`);
}

async function searchCountry(q: SearchQuery, country: string): Promise<ITunesResult[]> {
  const term = q.artist ? `${q.title} ${q.artist}` : q.title;
  const url =
    'https://itunes.apple.com/search?term=' +
    encodeURIComponent(term) +
    `&media=music&entity=song&limit=8&country=${country}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ProviderError('Network error', 'itunes', 'network');
  }
  if (res.status === 429) throw new ProviderError('Too many requests', 'itunes', 'ratelimit');
  if (!res.ok) throw new ProviderError(`HTTP ${res.status}`, 'itunes', 'network');
  const data = (await res.json()) as ITunesResponse;
  return data.results ?? [];
}

export const itunesProvider: MusicProvider = {
  name: 'itunes',
  async search(query) {
    // Query the configured storefront plus US in parallel for wider coverage.
    const countries = COUNTRY === 'US' ? ['US'] : [COUNTRY, 'US'];
    const settled = await Promise.allSettled(countries.map((c) => searchCountry(query, c)));
    const rows: ITunesResult[] = [];
    let firstError: unknown = null;
    settled.forEach((s, i) => {
      if (s.status === 'fulfilled') rows.push(...s.value);
      else if (i === 0) firstError = s.reason;
    });
    if (!rows.length && firstError) throw firstError;

    const seen = new Set<string>();
    const out: Omit<TrackCandidate, 'confidence'>[] = [];
    for (const r of rows) {
      const key = normalize(`${r.trackName}|${r.artistName}|${r.collectionName}`);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `itunes-${r.trackId}`,
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName,
        coverUrl: upscaleArtwork(r.artworkUrl100, 600),
        releaseDate: r.releaseDate?.slice(0, 10),
        genre: r.primaryGenreName,
        source: 'itunes',
        sourceId: String(r.trackId),
      });
    }
    return out;
  },
};
