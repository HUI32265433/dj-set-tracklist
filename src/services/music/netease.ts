import type { MusicProvider, SearchQuery } from './types';
import { ProviderError } from './types';
import type { TrackCandidate } from '../../types/track';

/**
 * Optional NetEase Cloud Music provider.
 *
 * The well-known open-source NetEase API project was taken down in 2024 for
 * copyright reasons, and music.163.com itself has no CORS support — so this
 * provider talks ONLY to a user-hosted local proxy (see README). It is
 * disabled unless a proxy URL is configured in Settings / .env.
 */
export function createNetEaseProvider(proxyUrl: string | undefined): MusicProvider {
  return {
    name: 'netease',
    async search(query: SearchQuery) {
      if (!proxyUrl) throw new ProviderError('NetEase proxy not configured', 'netease', 'disabled');
      const keywords = query.artist ? `${query.title} ${query.artist}` : query.title;
      let res: Response;
      try {
        res = await fetch(`${proxyUrl.replace(/\/$/, '')}/cloudsearch?keywords=${encodeURIComponent(keywords)}&limit=8`);
      } catch {
        throw new ProviderError('NetEase proxy unreachable', 'netease', 'network');
      }
      if (!res.ok) throw new ProviderError(`HTTP ${res.status}`, 'netease', 'network');
      const data = (await res.json()) as {
        result?: {
          songs?: {
            id: number;
            name: string;
            ar?: { name: string }[];
            al?: { name: string; picUrl?: string };
            publishTime?: number;
          }[];
        };
      };
      return (data.result?.songs ?? []).map((s): Omit<TrackCandidate, 'confidence'> => ({
        id: `netease-${s.id}`,
        title: s.name,
        artist: s.ar?.map((a) => a.name).join('/') ?? '',
        album: s.al?.name ?? '',
        coverUrl: s.al?.picUrl ? `${s.al.picUrl}?param=600y600` : undefined,
        releaseDate: s.publishTime ? new Date(s.publishTime).toISOString().slice(0, 10) : undefined,
        source: 'netease',
        sourceId: String(s.id),
      }));
    },
  };
}
