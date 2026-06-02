# 菜包（CaiBao）

CaiBao 是一个基于 Electron 的桌面 AI 聊天客户端，支持 OpenAI API 格式，并内置 DashScope 模式（原生 HTTP Generation + 兼容模型同步）。

## 技术栈

- Electron 34
- Rspack 2
- React 18 + TypeScript（strict）
- Zustand（状态管理）
- react-markdown + remark/rehype（Markdown、代码高亮、表格、公式渲染）
- electron-builder（安装包构建）

## 项目结构

```text
src/
├── main/       # Electron 主进程（窗口、IPC、本地存储）
├── preload/    # 预加载脚本（主渲染桥接）
├── renderer/   # React 前端（页面、组件、store、LLM 服务）
└── shared/     # 跨进程共享类型与配置
```

构建产物：`dist/`  
打包产物：`release/`

## 环境要求

- Node.js 20+
- npm 10+
- macOS 打包场景建议安装 Xcode Command Line Tools

## 本地开发

```bash
npm install
npm run dev
```

`npm run dev` 会并行启动：

1. Renderer 开发服务器（默认 `http://localhost:5173`）
2. Main / Preload 增量构建
3. Electron 应用窗口

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 本地开发（watch + Electron） |
| `npm run build` | 生产构建（main/preload/renderer） |
| `npm run build:renderer` | 仅构建前端 |
| `npm run dist` | 全平台默认打包（按 electron-builder 配置） |
| `npm run dist:mac` | 构建 macOS arm64 DMG，并执行 ad-hoc 重签名 |
| `npm run sign:mac` | 对已有 `release/**/.app` 执行 ad-hoc 重签名 |
| `npm run fix:mac-gatekeeper` | 清除应用隔离属性（`com.apple.quarantine`） |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |

## 配置与运行机制

- Provider 模式：
  - `dashscope`：聊天走 DashScope 原生 HTTP Generation；模型同步走兼容接口
  - `openai-compatible`：统一走 OpenAI 兼容接口
- 设置数据存储在本地用户目录（`userData/caibao/`），包含模型列表、已启用模型和 API 配置。
- 聊天会话与消息持久化在本地；支持流式输出、思考过程、联网搜索结果、Token 用量。

## Markdown 渲染能力

- GFM（表格、任务列表等）
- 代码高亮（highlight.js）
- 数学公式（remark-math + rehype-katex）
- 表格横向滚动与列宽上限

## macOS 打包与分发

### 构建

```bash
npm run dist:mac
```

该流程会：

1. 构建 `dist/`
2. 生成 arm64 `.app` 与 `.dmg`
3. 对 `.app` 执行 ad-hoc 深度签名（`codesign --deep --sign -`）

### 常见问题：应用提示“已损坏，无法打开”

该问题通常由 Gatekeeper 与隔离属性导致，并不一定表示包体损坏。处理方式：

```bash
npm run fix:mac-gatekeeper
# 或手动
xattr -cr /Applications/菜包.app
```

若仍被拦截，首次可在 Finder 中右键应用并选择“打开”。

### 正式发布建议

对外分发建议配置 Apple Developer ID 签名与 notarization（`CSC_*`、`APPLE_ID` 等环境变量），以避免终端用户手工绕过 Gatekeeper。

## 版本与兼容性

- 当前 macOS 最低版本：`11.0`（Apple Silicon 推荐使用 arm64 包）
- Electron 升级时请同步验证：签名流程、LSMinimumSystemVersion、打包脚本
