import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track, TrackCandidate, ViewMode } from '../types/track';

interface SetState {
  setName: string;
  tracks: Track[];
  viewMode: ViewMode;
  accent: string | null;
  neteaseProxyUrl: string;

  addCandidate: (c: TrackCandidate) => void;
  addCandidates: (cs: TrackCandidate[]) => void;
  addManual: (partial: Partial<Track> & { title: string }) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  removeTrack: (id: string) => void;
  duplicateTrack: (id: string) => void;
  moveTrack: (activeId: string, overId: string) => void;
  clearSet: () => void;
  renameSet: (name: string) => void;
  setViewMode: (m: ViewMode) => void;
  setAccent: (a: string | null) => void;
  setNeteaseProxyUrl: (u: string) => void;
}

function renumber(tracks: Track[]): Track[] {
  return tracks.map((t, i) => ({ ...t, position: i + 1 }));
}

function fromCandidate(c: TrackCandidate): Track {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    position: 0,
    title: c.title,
    artist: c.artist,
    album: c.album,
    coverUrl: c.coverUrl,
    releaseDate: c.releaseDate,
    genre: c.genre,
    source: c.source,
    sourceId: c.sourceId,
    confidence: c.confidence,
    createdAt: now,
    updatedAt: now,
  };
}

export const useSetStore = create<SetState>()(
  persist(
    (set) => ({
      setName: 'UNTITLED SET',
      tracks: [],
      viewMode: 'compact',
      accent: null,
      neteaseProxyUrl: '',

      addCandidate: (c) =>
        set((s) => ({ tracks: renumber([...s.tracks, fromCandidate(c)]) })),
      addCandidates: (cs) =>
        set((s) => ({ tracks: renumber([...s.tracks, ...cs.map(fromCandidate)]) })),
      addManual: (partial) =>
        set((s) => {
          const now = Date.now();
          const t: Track = {
            position: 0,
            artist: '',
            album: '',
            ...partial,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          return { tracks: renumber([...s.tracks, t]) };
        }),
      updateTrack: (id, patch) =>
        set((s) => ({
          tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
        })),
      removeTrack: (id) =>
        set((s) => ({ tracks: renumber(s.tracks.filter((t) => t.id !== id)) })),
      duplicateTrack: (id) =>
        set((s) => {
          const idx = s.tracks.findIndex((t) => t.id === id);
          if (idx < 0) return s;
          const copy: Track = {
            ...s.tracks[idx],
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const next = [...s.tracks];
          next.splice(idx + 1, 0, copy);
          return { tracks: renumber(next) };
        }),
      moveTrack: (activeId, overId) =>
        set((s) => {
          const from = s.tracks.findIndex((t) => t.id === activeId);
          const to = s.tracks.findIndex((t) => t.id === overId);
          if (from < 0 || to < 0 || from === to) return s;
          const next = [...s.tracks];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { tracks: renumber(next) };
        }),
      clearSet: () => set({ tracks: [] }),
      renameSet: (name) => set({ setName: name.trim() || 'UNTITLED SET' }),
      setViewMode: (m) => set({ viewMode: m }),
      setAccent: (a) => set({ accent: a }),
      setNeteaseProxyUrl: (u) => set({ neteaseProxyUrl: u.trim() }),
    }),
    {
      name: 'djset-store-v1',
      version: 1,
    },
  ),
);
