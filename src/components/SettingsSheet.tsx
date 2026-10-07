import BottomSheet from './BottomSheet';
import { useSetStore } from '../store/useSetStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: Props) {
  const { neteaseProxyUrl, setNeteaseProxyUrl } = useSetStore();
  return (
    <BottomSheet open={open} onClose={onClose} title="设置">
      <div className="space-y-4 p-4 pb-8">
        <div>
          <p className="text-[13px] font-medium">网易云音乐（可选 · 本地代理）</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">
            线上版默认使用 iTunes + MusicBrainz。如果你在自己电脑上运行了网易云本地代理
            （见 README），把地址填在这里即可启用网易云搜索与历史记录导入。留空则关闭。
          </p>
          <input
            className="input-dark mt-2 font-mono"
            placeholder="http://localhost:3000"
            value={neteaseProxyUrl}
            onChange={(e) => setNeteaseProxyUrl(e.target.value)}
          />
        </div>
        <div className="rounded-md border border-ink-border bg-ink-row p-3 text-[11px] leading-relaxed text-ink-dim">
          <p>· 所有数据仅保存在本机浏览器（localStorage + IndexedDB），不上传任何服务器。</p>
          <p className="mt-1">· 已保存的 Tracklist 可离线查看；搜索歌曲需要联网。</p>
          <p className="mt-1">· 可通过浏览器「添加到主屏幕」作为 App 使用。</p>
        </div>
      </div>
    </BottomSheet>
  );
}
