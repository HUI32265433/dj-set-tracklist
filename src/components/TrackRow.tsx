import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import CoverImage from './CoverImage';
import type { Track, ViewMode } from '../types/track';

interface Props {
  track: Track;
  mode: ViewMode;
  onOpen: (t: Track) => void;
}

export default memo(function TrackRow({ track, mode, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isClassic = mode === 'classic';
  const cover = isClassic ? 56 : 40;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-b border-ink-border/60 px-3 ${
        track.position % 2 === 0 ? 'bg-ink-alt' : 'bg-ink-row'
      } ${isClassic ? 'py-2.5' : 'py-1.5'} ${isDragging ? 'shadow-xl ring-1 ring-[var(--accent)]' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
        className="touch-none px-1 py-2 text-ink-dim/50 active:text-[var(--accent)]"
      >
        <GripVertical size={16} />
      </button>
      <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim">
        {String(track.position).padStart(2, '0')}
      </span>
      <CoverImage track={track} size={cover} />
      <button onClick={() => onOpen(track)} className="min-w-0 flex-1 py-1 text-left">
        <div className={`truncate font-medium leading-tight ${isClassic ? 'text-[15px]' : 'text-[13px]'}`}>
          {track.title || '—'}
        </div>
        <div className="truncate text-xs leading-tight text-ink-dim">{track.artist || 'Unknown Artist'}</div>
        {track.album && (
          <div className="truncate text-[11px] leading-tight text-ink-dim/60">{track.album}</div>
        )}
      </button>
      {track.confidence !== undefined && track.confidence < 0.85 && (
        <span className="shrink-0 rounded-sm border border-amber-500/40 px-1 py-0.5 text-[9px] font-semibold text-amber-400">
          CHECK
        </span>
      )}
      {track.energy && (
        <span className="shrink-0 font-mono text-[10px] text-ink-dim/70">E{track.energy}</span>
      )}
    </div>
  );
});
