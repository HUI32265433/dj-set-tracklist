import { Copy, Image, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import CoverImage from './CoverImage';
import { searchTracks } from '../services/music/search';
import { saveUploadedCover } from '../utils/image';
import { useSetStore } from '../store/useSetStore';
import type { Mood, Track } from '../types/track';

const MOODS: Mood[] = ['Dark', 'Happy', 'Emotional', 'Aggressive', 'Chill'];

interface Props {
  track: Track | null;
  onClose: () => void;
}

export default function TrackDetailSheet({ track, onClose }: Props) {
  const { updateTrack, removeTrack, duplicateTrack, neteaseProxyUrl } = useSetStore();
  const [coverSearch, setCoverSearch] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverOptions, setCoverOptions] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCoverSearch(false);
    setCoverOptions([]);
  }, [track?.id]);

  if (!track) return null;
  const patch = (p: Partial<Track>) => updateTrack(track.id, p);

  async function reSearchCovers() {
    if (!track) return;
    setCoverLoading(true);
    try {
      const { candidates } = await searchTracks(track.title, track.artist || undefined, {
        neteaseProxyUrl: neteaseProxyUrl || undefined,
      });
      setCoverOptions([...new Set(candidates.map((c) => c.coverUrl).filter((u): u is string => !!u))]);
      setCoverSearch(true);
    } finally {
      setCoverLoading(false);
    }
  }

  async function upload(file: File) {
    const key = await saveUploadedCover(file);
    patch({ coverKey: key });
  }

  return (
    <BottomSheet open={!!track} onClose={onClose} title={`#${String(track.position).padStart(2, '0')} 编辑`}>
      <div className="space-y-4 p-4 pb-8">
        <div className="flex gap-4">
          <CoverImage track={track} size={88} />
          <div className="flex flex-1 flex-col gap-2">
            <button onClick={reSearchCovers} disabled={coverLoading} className="btn-ghost text-xs">
              {coverLoading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
              重新搜索封面
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs">
              <ImagePlus size={14} /> 上传本地封面
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {coverSearch && (
          <div className="grid grid-cols-4 gap-2">
            {coverOptions.length === 0 && <p className="col-span-4 text-xs text-ink-dim">没有找到封面。</p>}
            {coverOptions.map((u) => (
              <button key={u} onClick={() => { patch({ coverUrl: u, coverKey: undefined }); setCoverSearch(false); }}>
                <img src={u} alt="" className="aspect-square w-full rounded-sm border border-ink-border object-cover active:border-[var(--accent)]" />
              </button>
            ))}
          </div>
        )}

        {(['title', 'artist', 'album'] as const).map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              {field === 'title' ? '歌曲名' : field === 'artist' ? '艺人' : '专辑'}
            </span>
            <input
              className="input-dark"
              value={track[field]}
              onChange={(e) => patch({ [field]: e.target.value })}
            />
          </label>
        ))}

        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Energy</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => patch({ energy: track.energy === n ? undefined : n })}
                className={`flex-1 rounded-sm border py-2 font-mono text-xs ${
                  track.energy === n ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-ink-border text-ink-dim'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Mood</span>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => patch({ mood: track.mood === m ? undefined : m })}
                className={`rounded-sm border px-2.5 py-1.5 text-xs ${
                  track.mood === m ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-ink-border text-ink-dim'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">备注</span>
          <textarea
            className="input-dark resize-none"
            rows={2}
            value={track.note ?? ''}
            onChange={(e) => patch({ note: e.target.value })}
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={() => { duplicateTrack(track.id); onClose(); }} className="btn-ghost flex-1">
            <Copy size={14} /> 复制
          </button>
          <button
            onClick={() => { removeTrack(track.id); onClose(); }}
            className="btn-ghost flex-1 border-red-500/40 text-red-400"
          >
            <Trash2 size={14} /> 删除
          </button>
        </div>
        <p className="text-center text-[10px] text-ink-dim/50">
          {track.source ? `来源: ${track.source} · ` : ''}更新于 {new Date(track.updatedAt).toLocaleString()}
        </p>
      </div>
    </BottomSheet>
  );
}
