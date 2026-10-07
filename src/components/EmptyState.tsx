import { ListMusic } from 'lucide-react';

export default function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-border bg-ink-row text-ink-dim">
        <ListMusic size={28} />
      </div>
      <div>
        <p className="text-sm font-medium">Tracklist 还是空的</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">
          搜索歌曲并加入你的 DJ Set，或一次粘贴整份歌单批量添加。
        </p>
      </div>
      <button onClick={onAdd} className="btn-primary">
        ＋ 添加第一首歌
      </button>
    </div>
  );
}
