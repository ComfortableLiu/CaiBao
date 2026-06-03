# 菜包（CaiBao）

CaiBao 是一个基于 Electron 的桌面 AI 聊天客户端（当前 **0.3.0**），支持 OpenAI API 格式，并内置 DashScope 模式（原生 HTTP Generation / 多模态 Generation + 兼容模型同步）。支持图文聊天、S3 兼容对象存储与联网搜索、深度思考等能力。

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
| `npm run dist:win` | 构建 Windows x64 安装包（NSIS）+ 便携版（portable） |
| `npm run dist:win:portable` | 仅构建 Windows x64 便携版（免安装） |
| `npm run dist:win:all` | 显式构建 Windows x64 NSIS + portable |
| `npm run sign:mac` | 对已有 `release/**/.app` 执行 ad-hoc 重签名 |
| `npm run fix:mac-gatekeeper` | 清除应用隔离属性（`com.apple.quarantine`） |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |

## 功能特性

### 聊天与模型

- 多会话、本地持久化、首条消息自动生成标题
- 流式输出、思考过程（`reasoning_content`）、联网搜索来源展示
- Token 用量 footer + 悬停明细（输入/输出细分，含图片 Token、思考 Token、缓存命中等，DashScope 流式 `usage`）
- 发送中 Enter 不重复发送；发送钮在流式时变为停止
- 消息图片加载失败时显示占位，点击可查看失败详情（URL、对象键等）

### 多模态与对象存储（0.3.0）

- 聊天可附加图片（选择 / 粘贴 / 拖拽），上传至 **S3 兼容存储**（MinIO、AWS S3 等），消息 JSON 只存元数据与 URL
- **设置 → 模型服务**：每个已启用模型可单独开关「支持图片输入」
- **设置 → 对象存储**：Endpoint、Region、Bucket、AK/SK（加密落盘）、Path-style、对外访问地址、预签名 URL、对象键前缀；支持测试连接
- **未配置对象存储时仍可使用纯文字聊天**；仅在尝试添加/发送图片时提示先去配置 S3
- **未配置模型服务时**聊天页半透明遮罩，可一键跳转对应设置项
- 删除会话时按 `{keyPrefix}/{conversationId}/` 清理桶内附件，并兜底删除消息里记录的对象键

### DashScope 请求策略

- 历史消息含有效图片 URL 时走 `multimodal-generation`；`qwen3.7-plus`、`qwen3.6-plus`、`qwen3.5-plus`、`qwen3-vl` 等型号即使纯文本也走多模态端点（避免百炼 `url error`）
- 图片 URL 须公网可访问（不可为 localhost / 内网）；可在「对外访问地址」或预签名 URL 中配置
- 当前模型**未开启图片**时，发往 API 的上下文会自动去掉 `image_url`，仅保留文字（纯图历史消息以 `[图片]` 占位）

### 设置页

- 左侧目录：**模型服务** / **对象存储** / **聊天偏好**（主题、深度思考、联网搜索）
- 不使用 `.env` 注入配置，全部在 UI 保存至本机

## 配置与运行机制

- Provider 模式：
  - `dashscope`：聊天走 DashScope 原生 HTTP（文本 `text-generation` 或多模态 `multimodal-generation`）；模型列表走兼容接口
  - `openai-compatible`：统一走 OpenAI 兼容接口
- 设置与凭证存储在 `userData/caibao/settings.json`（API Key、对象存储 AK/SK 加密）；会话在 `userData/caibao/conversations/`。
- 对象存储表单项**无预填默认值**（Endpoint / Bucket / Region 等需自行填写）；运行时若对象键前缀为空，上传路径仍默认使用 `attachments`。

手动测试见 [TESTING.md](./TESTING.md)。

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

## Windows 打包与分发

### 构建

```bash
npm run dist:win
```

默认生成 Windows x64 两类产物（位于 `release/`）：

- NSIS 安装包：`菜包-<version>-win-x64.exe`
- Portable 免安装包：`菜包-<version>-win-portable-x64.exe`

当前 NSIS 策略：

- 非 one-click 安装（可选择安装目录）
- 创建桌面与开始菜单快捷方式

### 图标与品牌资源

- 若未提供图标，electron-builder 会使用默认 Electron 图标。
- 建议在仓库中提供：
  - `build/icon.ico`（Windows）
  - `build/icon.icns`（macOS）
- 添加后可在 `build.win.icon` / `build.mac.icon` 显式引用，保证品牌一致性。

### 分发注意事项

- 未配置代码签名证书时，首次运行可能触发 SmartScreen 警告。
- 对外正式发布建议配置 Windows 代码签名（`CSC_LINK` / `CSC_KEY_PASSWORD`），以降低拦截率并提升安装可信度。

示例（PowerShell）：

```powershell
$env:CSC_LINK="C:\cert\codesign.pfx"
$env:CSC_KEY_PASSWORD="your-password"
npm run dist:win
```

## 版本与兼容性

- 当前 macOS 最低版本：`11.0`（Apple Silicon 推荐使用 arm64 包）
- Electron 升级时请同步验证：签名流程、LSMinimumSystemVersion、打包脚本
