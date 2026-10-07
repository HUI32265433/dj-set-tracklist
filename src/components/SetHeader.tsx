import { MoreVertical, LayoutList, LayoutGrid, Rows3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSetStore } from '../store/useSetStore';
import type { ViewMode } from '../types/track';

interface Props {
  onExport: () => void;
  onSettings: () => void;
}

const VIEWS: { id: ViewMode; icon: typeof Rows3; label: string }[] = [
  { id: 'compact', icon: Rows3, label: '紧凑' },
  { id: 'classic', icon: LayoutList, label: '经典' },
  { id: 'poster', icon: LayoutGrid, label: '海报' },
];

export default function SetHeader({ onExport, onSettings }: Props) {
  const { setName, tracks, viewMode, setViewMode, renameSet, clearSet } = useSetStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(setName);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-border bg-ink-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 lg:max-w-3xl">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--accent)]">DJ SET</div>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                renameSet(draft);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="input-dark mt-0.5 py-1 text-base font-bold"
            />
          ) : (
            <button onClick={() => { setDraft(setName); setEditing(true); }} className="block truncate text-left">
              <h1 className="truncate text-base font-bold leading-tight">{setName}</h1>
            </button>
          )}
          <div className="mt-0.5 text-[11px] text-ink-dim">
            Tracks: {tracks.length} · Duration: --
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden overflow-hidden rounded-md border border-ink-border sm:flex">
            {VIEWS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                title={label}
                className={`p-2 ${viewMode === id ? 'bg-ink-alt text-[var(--accent)]' : 'text-ink-dim'}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="菜单"
              className="rounded-md border border-ink-border p-2 text-ink-dim active:bg-ink-alt"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-md border border-ink-border bg-ink-row py-1 shadow-xl">
                {[
                  { label: '重命名 Set', fn: () => { setDraft(setName); setEditing(true); } },
                  { label: '导出', fn: onExport },
                  { label: '设置', fn: onSettings },
                  { label: '清空 Set', fn: () => { if (confirm('确定清空整个 Tracklist？')) clearSet(); }, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setMenuOpen(false); item.fn(); }}
                    className={`block w-full px-4 py-2.5 text-left text-sm active:bg-ink-alt ${
                      item.danger ? 'text-red-400' : 'text-ink-text'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-lg gap-1 px-4 pb-2 sm:hidden lg:max-w-3xl">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`rounded-sm px-2 py-1 text-[11px] ${
              viewMode === id ? 'bg-ink-alt text-[var(--accent)]' : 'text-ink-dim'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
