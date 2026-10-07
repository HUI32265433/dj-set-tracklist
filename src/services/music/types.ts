import type { TrackCandidate } from '../../types/track';

export interface SearchQuery {
  title: string;
  artist?: string;
}

export interface MusicProvider {
  readonly name: TrackCandidate['source'];
  /** Return raw candidates; confidence is assigned centrally by the ranking layer. */
  search(query: SearchQuery): Promise<Omit<TrackCandidate, 'confidence'>[]>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly kind: 'network' | 'ratelimit' | 'parse' | 'disabled',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
