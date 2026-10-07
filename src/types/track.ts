export type Mood = 'Dark' | 'Happy' | 'Emotional' | 'Aggressive' | 'Chill';

export type ProviderName = 'itunes' | 'musicbrainz' | 'netease';

export interface Track {
  id: string;
  position: number;
  title: string;
  artist: string;
  album: string;
  /** remote cover URL */
  coverUrl?: string;
  /** idb-keyval key for a locally uploaded cover (dataURL) */
  coverKey?: string;
  releaseDate?: string;
  genre?: string;
  source?: ProviderName;
  sourceId?: string;
  confidence?: number;
  energy?: number; // 1-5
  mood?: Mood;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/** Unified search result across all providers */
export interface TrackCandidate {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  releaseDate?: string;
  genre?: string;
  source: ProviderName;
  sourceId?: string;
  /** 0..1, assigned by the ranking layer */
  confidence: number;
}

export type ViewMode = 'compact' | 'classic' | 'poster';

export type ExportStyleId = 'compact' | 'classic' | 'poster' | 'mono' | 'accent';

export interface BatchItem {
  query: string;
  status: 'pending' | 'searching' | 'matched' | 'confirm' | 'failed';
  candidates: TrackCandidate[];
  selected?: TrackCandidate;
}
