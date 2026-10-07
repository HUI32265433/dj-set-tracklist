import { ClipboardList, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddTrackSheet from './components/AddTrackSheet';
import BatchAddSheet from './components/BatchAddSheet';
import EmptyState from './components/EmptyState';
import ExportSheet from './components/ExportSheet';
import SetHeader from './components/SetHeader';
import SettingsSheet from './components/SettingsSheet';
import TrackDetailSheet from './components/TrackDetailSheet';
import TrackList from './components/TrackList';
import { useSetStore } from './store/useSetStore';
import { extractAccent } from './utils/image';
import type { Track } from './types/track';

type Sheet = 'none' | 'add' | 'batch' | 'export' | 'settings';

export default function App() {
  const tracks = useSetStore((s) => s.tracks);
  const viewMode = useSetStore((s) => s.viewMode);
  const accent = useSetStore((s) => s.accent);
  const setAccent = useSetStore((s) => s.setAccent);

  const [sheet, setSheet] = useState<Sheet>('none');
  const [addMenu, setAddMenu] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  // apply / refresh the set-wide accent color from covers (debounced)
  useEffect(() => {
    const urls = tracks.map((t) => t.coverUrl).filter((u): u is string => !!u);
    if (!urls.length) {
      setAccent(null);
      return;
    }
    const timer = setTimeout(() => {
      void extractAccent(urls).then((a) => a && setAccent(a));
    }, 800);
    return () => clearTimeout(timer);
  }, [tracks, setAccent]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent ?? '#f472b6');
  }, [accent]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg lg:max-w-3xl">
      <SetHeader onExport={() => setSheet('export')} onSettings={() => setSheet('settings')} />

      <main className="pb-28">
        {tracks.length === 0 ? (
          <EmptyState onAdd={() => setSheet('add')} />
        ) : viewMode === 'poster' ? (
          <PosterView tracks={tracks} onOpen={setActiveTrack} />
        ) : (
          <TrackList onOpenTrack={setActiveTrack} />
        )}
      </main>

      {/* floating add */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-4 pb-5 lg:max-w-3xl">
        {addMenu && (
          <div className="mb-2 overflow-hidden rounded-lg border border-ink-border bg-ink-row shadow-2xl">
            <button
              onClick={() => { setAddMenu(false); setSheet('add'); }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm active:bg-ink-alt"
            >
              <Search size={16} className="text-[var(--accent)]" /> 搜索单曲
            </button>
            <button
              onClick={() => { setAddMenu(false); setSheet('batch'); }}
              className="flex w-full items-center gap-3 border-t border-ink-border/60 px-4 py-3.5 text-left text-sm active:bg-ink-alt"
            >
              <ClipboardList size={16} className="text-[var(--accent)]" /> 批量添加（粘贴歌单）
            </button>
          </div>
        )}
        <button onClick={() => setAddMenu((v) => !v)} className="btn-primary w-full shadow-lg">
          <Plus size={18} /> Add Track
        </button>
      </div>

      <AddTrackSheet open={sheet === 'add'} onClose={() => setSheet('none')} />
      <BatchAddSheet open={sheet === 'batch'} onClose={() => setSheet('none')} />
      <ExportSheet open={sheet === 'export'} onClose={() => setSheet('none')} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet('none')} />
      <TrackDetailSheet track={activeTrack} onClose={() => setActiveTrack(null)} />
    </div>
  );
}

/** Poster view: the set as a live flyer — big type, no covers. */
function PosterView({ tracks, onOpen }: { tracks: Track[]; onOpen: (t: Track) => void }) {
  return (
    <div className="px-5 py-6">
      {tracks.map((t) => (
        <button
          key={t.id}
          onClick={() => onOpen(t)}
          className="flex w-full items-baseline gap-3 border-b border-ink-border/50 py-3 text-left"
        >
          <span className="font-mono text-sm text-[var(--accent)]">{String(t.position).padStart(2, '0')}</span>
          <span className="flex-1 truncate text-lg font-bold">{t.title}</span>
          <span className="max-w-[40%] truncate text-xs text-ink-dim">{t.artist}</span>
        </button>
      ))}
    </div>
  );
}
