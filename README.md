# DJ Set / Tracklist Generator

移动端优先的 **DJ Set 可视化 Tracklist 生成器**。
输入歌名 → 自动搜索音乐资料（封面 / 艺人 / 专辑 / 发行日期）→ 加入 Tracklist → 排序编辑 → 导出专业风格的 Tracklist 图片。

> 这不是音频播放器。项目不处理、不存储任何音频文件。

## 功能

- **单曲搜索添加**：iTunes Search API 为主、MusicBrainz 兜底，自动获取高清封面与元数据
- **批量添加**：粘贴整份歌单（每行一首，支持「标题 - 艺人」），自动去空行 / 去重 / 限流并发搜索；低置信度结果**不会自动加入**，需手动确认版本
- **置信度系统**：每个匹配带 0–100% 置信度（≥85% 高可信自动推荐，55–85% 待确认，<55% 不自动添加）
- **拖拽排序**：dnd-kit，手机端长按拖动、桌面端鼠标拖动，编号永远自动重排
- **编辑**：标题 / 艺人 / 专辑 / 备注 / Energy(1-5) / Mood；封面可重新搜索或**本地上传**（存 IndexedDB，不走图床）
- **自动保存**：Tracklist、排序、手动修改、UI 设置全部持久化（localStorage + IndexedDB），刷新不丢
- **三种列表视图**：紧凑（高密度 DJ 软件风）/ 经典（大封面）/ 海报（节目单排版）
- **Set 视觉调色**：从整套封面提取主题色，自动点缀按钮 / 选中态 / 细线
- **导出**：PNG（**5 种视觉风格**：紧凑暗色 / 经典大封面 / 演出海报 / 极简黑白 / 调色点缀，3x 高清）+ JSON / TXT / CSV
- **PWA**：可添加到手机主屏幕，已保存的 Set 离线可看

## 技术栈

React 18 · TypeScript (strict) · Vite · Tailwind CSS · Zustand (persist) · dnd-kit · Fuse.js 思路的自研相似度打分 · modern-screenshot · idb-keyval · Lucide · vite-plugin-pwa

## 开发

```bash
npm install
npm run dev       # 开发
npm run build     # 构建（含 tsc 严格检查）
npm run preview   # 预览构建产物
```

## 部署

纯静态站点，构建产物在 `dist/`。Vercel / Cloudflare Pages / Netlify 均零配置可直接部署（框架预设选 Vite）。

## 音乐数据来源

| Provider | 说明 | 浏览器直调 |
|---|---|---|
| iTunes Search API | 主力。无需 key；封面 URL 由 100px 升级至 600px | ✅ |
| MusicBrainz + Cover Art Archive | 兜底。严格 1 req/s（已内置队列限流），附带 MBID | ✅ |
| 网易云（可选） | 仅通过用户自托管本地代理，默认关闭 | 经本地代理 |

### 网易云本地代理（可选）

开源项目 NeteaseCloudMusicApi 已于 2024 年因版权原因被作者删库停更，网易云官方接口也不支持 CORS，因此**线上版不内置网易云**。
如需网易云搜索 / 登录 / 听歌历史：请在自己电脑上运行一个本地代理服务（自行承担合规责任），然后在 App「设置」中填入代理地址（如 `http://localhost:3000`），或配置 `.env`：

```bash
cp .env.example .env
# VITE_NETEASE_PROXY_URL=http://localhost:3000
```

App 会以 `GET {proxy}/cloudsearch?keywords=...&limit=8` 约定调用（返回结构与常见 NetEase API 代理一致）。

## 环境变量

见 `.env.example`。没有任何必填项；不配置也能完整使用（iTunes + MusicBrainz）。

## 开源依赖与 License

| 依赖 | License |
|---|---|
| react / react-dom | MIT |
| vite / @vitejs/plugin-react | MIT |
| tailwindcss | MIT |
| zustand | MIT |
| @dnd-kit/* | MIT |
| fuse.js | Apache-2.0 |
| modern-screenshot | MIT |
| idb-keyval | Apache-2.0 |
| lucide-react | ISC |
| vite-plugin-pwa | MIT |

封面与元数据版权归原权利方所有，导出的 Tracklist 图片仅供个人非商业使用。

## 目录结构

```
src/
├── components/        # SetHeader / TrackList / TrackRow / AddTrackSheet /
│   │                  # BatchAddSheet / TrackDetailSheet / ExportSheet / BottomSheet …
│   └── export/        # ExportCanvas（5 种 PNG 导出视觉）
├── services/music/    # MusicProvider 层：itunes / musicbrainz / netease / search(含批量)
├── store/             # useSetStore（zustand + persist）
├── utils/             # normalize / similarity(置信度) / image(封面+调色) / export
└── types/             # Track / TrackCandidate / ViewMode / ExportStyleId
```
