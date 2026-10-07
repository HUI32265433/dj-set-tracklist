import { AlertTriangle, Check, Loader2, Music2, Plus, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { searchTracks, type SearchOutcome } from '../services/music/search';
import { confidenceLabel } from '../utils/similarity';
import { useSetStore } from '../store/useSetStore';
import type { TrackCandidate } from '../types/track';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTrackSheet({ open, onClose }: Props) {
  const addCandidate = useSetStore((s) => s.addCandidate);
  const addManual = useSetStore((s) => s.addManual);
  const neteaseProxyUrl = useSetStore((s) => s.neteaseProxyUrl);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [searching, setSearching] = useState(false);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);

  async function doSearch() {
    if (!title.trim() || searching) return;
    setSearching(true);
    setAttempted(true);
    setOutcome(null);
    try {
      const r = await searchTracks(title.trim(), artist.trim() || undefined, {
        neteaseProxyUrl: neteaseProxyUrl || undefined,
      });
      setOutcome(r);
    } finally {
      setSearching(false);
    }
  }

  function add(c: TrackCandidate) {
    addCandidate(c);
    setAddedIds((prev) => new Set(prev).add(c.id));
  }

  const candidates = outcome?.candidates ?? [];
  const networkError = outcome?.errors.find((e) => e.kind === 'network');
  const rateLimited = outcome?.errors.find((e) => e.kind === 'ratelimit');

  return (
    <BottomSheet open={open} onClose={onClose} title="搜索歌曲">
      <div className="space-y-3 p-4">
        <input
          className="input-dark"
          placeholder="歌曲名称，例如 Endless Story"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          autoFocus
        />
        <input
          className="input-dark"
          placeholder="艺人（可选，提高匹配准确度）"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
        />
        <button onClick={doSearch} disabled={searching || !title.trim()} className="btn-primary w-full disabled:opacity-50">
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {searching ? '正在搜索音乐资料库…' : '搜索'}
        </button>

        {rateLimited && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle size={14} /> 请求过于频繁，请稍等几秒
            <button onClick={doSearch} className="ml-auto flex items-center gap-1 underline">
              <RotateCcw size={12} /> 重试
            </button>
          </div>
        )}
        {networkError && !rateLimited && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle size={14} /> 网络错误，部分数据源不可用（已自动降级）
          </div>
        )}

        {attempted && !searching && candidates.length === 0 && (
          <div className="rounded-md border border-ink-border bg-ink-row p-4 text-center">
            <p className="text-sm text-ink-dim">⚠ 没有找到可信的匹配结果</p>
            <button
              onClick={() => { addManual({ title: title.trim(), artist: artist.trim() }); onClose(); }}
              className="btn-ghost mt-3 w-full"
            >
              手动添加「{title.trim()}」（不带封面资料）
            </button>
          </div>
        )}

        <ul className="divide-y divide-ink-border/60 overflow-hidden rounded-md border border-ink-border">
          {candidates.map((c) => {
            const added = addedIds.has(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3 bg-ink-row px-3 py-2">
                {c.coverUrl ? (
                  <img src={c.coverUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-sm bg-ink-alt object-cover" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink-alt text-ink-dim">
                    <Music2 size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{c.title}</div>
                  <div className="truncate text-xs text-ink-dim">{c.artist}</div>
                  {c.album && <div className="truncate text-[11px] text-ink-dim/60">{c.album}</div>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      c.confidence >= 0.85 ? 'text-emerald-400' : c.confidence >= 0.55 ? 'text-amber-400' : 'text-ink-dim'
                    }`}
                  >
                    {Math.round(c.confidence * 100)}% {confidenceLabel(c.confidence)}
                  </span>
                  <button
                    onClick={() => add(c)}
                    disabled={added}
                    className={`flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold ${
                      added ? 'text-emerald-400' : 'bg-ink-alt text-ink-text active:scale-95'
                    }`}
                  >
                    {added ? <Check size={12} /> : <Plus size={12} />}
                    {added ? '已添加' : '添加'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {addedIds.size > 0 && (
          <button onClick={onClose} className="btn-ghost w-full">完成</button>
        )}
      </div>
    </BottomSheet>
  );
}
