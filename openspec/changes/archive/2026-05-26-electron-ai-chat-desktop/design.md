## Context

绿field 项目：在 CaiBao 仓库内从零实现 Electron 桌面 AI 聊天客户端。用户通过设置页配置 OpenAI 兼容端点，在聊天页进行多会话对话；数据全部本地持久化，无自建后端。

约束：
- 仅客户端；**LLM HTTP 请求在渲染进程（前端）发起**；主进程负责本地落盘与安全存储
- API Key 不得明文落盘、不得写入日志；可在渲染进程**内存**中暂存以供请求使用
- 需兼容主流 OpenAI Chat Completions 流式协议（含 `reasoning_content` / `delta.content` 等变体）
- 目标平台：macOS、Windows、Linux（Electron 默认跨平台）

## Goals / Non-Goals

**Goals:**

- Electron + React + TypeScript + **Rspack** 单体应用结构清晰可维护
- 设置页：baseURL、apiKey、模型同步与勾选
- 聊天页：多会话 IM 布局、流式思考+回复、Markdown/图片、消息元数据、复制
- 本地 JSON 文件或 SQLite 持久化会话与消息；首条消息后自动标题
- API Key 使用 Electron `safeStorage` 加密落盘

**Non-Goals:**

- 用户账号体系、云端同步、团队协作
- 内置模型推理（本地 GGUF 等）——仅通过 HTTP 调用外部 API
- 插件市场、RAG、工具调用（可作为后续迭代）
- 语音输入、多模态上传（除 Markdown 内嵌图片 URL 外）

## Decisions

### 1. 技术栈：Electron + Rspack + React + TypeScript

**选择**：手写 **Rspack 多入口配置**（`main` / `preload` / `renderer` 三个 target），渲染进程用 `@rspack/dev-server` 做 HMR，主进程用 `watch` 模式；开发时 `concurrently` 启动 dev-server 与 `electron .`。

**理由**：
- Rspack 基于 Rust，构建与热更新速度快，与 Webpack 配置模型兼容，便于 Electron 多进程分包
- 不依赖 `electron-vite`，打包链路可控（target、externals、`electron` 内置模块处理一目了然）
- 预加载脚本通过 `contextBridge` 暴露受限 IPC，避免 `nodeIntegration` 安全风险

**Rspack 配置要点**：
- **main**：`target: 'electron-main'`，`externals` 排除 `electron` 及 Node 内置模块
- **preload**：`target: 'electron-preload'`，输出单文件供 `webPreferences.preload` 引用
- **renderer**：`target: 'web'`，`devServer` 供开发态加载；生产构建输出静态 HTML/JS/CSS
- **共用**：`builtin:swc-loader` 处理 TS/TSX；`resolve.alias` 统一 `@/` 路径
- **开发脚本**：`rspack build -c rspack.main.config.mjs --watch` + `rspack serve -c rspack.renderer.config.mjs` + `wait-on` 后启动 Electron

**备选**：electron-vite（封装省事但绑定 Vite）、Tauri（Rust 成本高）、纯 Web（无法满足本地文件与 safeStorage）

### 2. 进程架构与 IPC

```
┌─────────────────────────────────────────────────────────┐
│ Renderer (React)                                         │
│  Settings │ Chat │ ConversationList                      │
│  - LlmClient (OpenAI SDK) ← HTTP/SSE 直连用户 baseURL    │
│  - ProviderService / ChatService / TitleService          │
│  - Zustand：流式状态、settings 内存缓存（含 apiKey）     │
└───────────────┬─────────────────────────────────────────┘
                │ contextBridge（仅本地数据与安全存储）
┌───────────────▼─────────────────────────────────────────┐
│ Preload                                                  │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│ Main Process                                             │
│  - StorageService（会话/消息/settings 落盘）             │
│  - SettingsService（apiKey 加密存取，不经由 LLM 代理）   │
└─────────────────────────────────────────────────────────┘
```

**理由**：
- LLM 请求放渲染进程：流式 chunk 直达 UI，无需 IPC 转发，延迟更低、实现更简单
- 主进程只做**本地 IO** 与 **apiKey 静态加密**；启动或保存设置后通过 IPC 将解密后的凭据交给渲染进程内存（不写 localStorage / 不写明文 JSON）

**IPC 边界（无 chat 流式通道）**：
- `storage:*` — 会话/消息 CRUD
- `settings:get` / `settings:save` — 含 baseURL、解密后 apiKey（仅回传渲染进程）、enabledModelIds、缓存的 model 列表

**备选**：主进程代理 LLM——更安全但多一跳 IPC，与「尽量前端发起」冲突，不采用。

### 3. LLM 客户端（渲染进程）：OpenAI SDK + 自定义 baseURL

**选择**：在 `src/renderer/services/llm/` 使用 `openai` 包，`createLlmClient({ baseURL, apiKey })`；渲染进程内调用 `models.list()` 与 `chat.completions.create({ stream: true })`。

**理由**：自动处理 SSE；与 OpenAI 兼容端点对齐；chunk 回调直接驱动 React 状态更新。

**凭据生命周期**：
1. 用户在设置页保存 → IPC `settings:save` → 主进程 `safeStorage` 加密 apiKey
2. 应用启动或进入设置/聊天前 → IPC `settings:get` → 写入 Zustand `settingsStore`（内存）
3. `LlmClient` 从 store 读取，禁止 `console.log` 凭据

**思考流**：监听 `chunk.choices[0].delta` 中 `reasoning_content`（DeepSeek 等）或 `content`；UI 用可折叠「思考过程」与「回复」分区。

**CORS**：Electron 渲染进程对第三方 API 通常不受浏览器 CORS 限制（`file://` / 自定义 protocol 场景按 Electron 文档配置）；若遇限制，可在 `session.webRequest` 放行或文档说明需 Provider 允许桌面客户端来源。

### 4. 本地存储：JSON 文件分片

**选择**：`{userData}/caibao/settings.json`、`conversations/{id}.json`。

**结构概要**：
- `Conversation`: `id`, `title`, `createdAt`, `updatedAt`, `modelId`, `messageIds[]`
- `Message`: `id`, `conversationId`, `role`, `content`, `reasoning?`, `model`, `createdAt`, `usage: { prompt, completion, total }`

**理由**：实现简单、易调试；会话量百级内性能足够。

**备选**：SQLite——消息量大时更优，初版可 YAGNI，接口抽象 `StorageService` 便于后续替换。

### 5. 自动标题

**选择**：用户发送首条消息后，异步调用同一 API（小模型或当前模型），system prompt：「用不超过 20 字总结用户问题作为对话标题」，不阻塞主回复流。

**理由**：体验与 ChatGPT/豆包一致。

### 6. UI 与 Markdown

**选择**：
- 布局：左侧会话列表（可折叠）+ 中间消息区 + 底部输入框（Enter 发送、Shift+Enter 换行）
- `react-markdown` + `remark-gfm` + `rehype-sanitize`（防 XSS）
- 图片：Markdown `![]()` 与 HTML img（sanitize 后）; 可选 `rehype-external-links` 新窗口打开

**Token 展示**：消息 footer 显示 `总 Token`；`Tooltip` 展示 prompt / completion / total。

### 7. 模型列表同步

**选择**：渲染进程 `client.models.list()`；结果经 IPC `settings:save` 写入 `settings.json` 的 `availableModels`（或由 renderer 调 storage IPC 更新）；用户勾选 `enabledModelIds`；聊天页模型下拉仅显示 enabled。

### 8. 流式状态管理

**选择**：渲染进程 Zustand 维护 `streamingMessageId` 与当前 assistant 草稿；`for await` / SDK 流回调内直接 `appendContent` / `appendReasoning`；流结束后 IPC 持久化完整消息。

**取消**：渲染进程 `AbortController`，与 `ChatService.send` 同作用域绑定。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 各厂商 SSE 字段不一致（reasoning、usage 在最后一个 chunk） | 适配层归一化 delta；文档注明已测 OpenAI/DeepSeek 兼容端点 |
| Markdown XSS | rehype-sanitize 白名单；禁用 raw HTML 或严格过滤 |
| apiKey 泄露 | 静态加密存主进程；渲染进程仅内存持有；禁止日志/DevTools 打印；设置页输入框 type=password |
| 渲染进程持钥面更大 | 接受为桌面客户端权衡；不启用 `nodeIntegration`，减少 XSS 攻击面 |
| 大对话 JSON 读写慢 | 单会话单文件；后续可迁 SQLite |
| 图片外链失效 | 显示占位；可选后续加本地缓存 |
| safeStorage 在 Linux 无密钥环 | 降级加密或明文警告（Electron 文档行为） |
| Rspack 无官方 Electron 一体化模板 | 维护三份 config + 开发启动脚本；参考社区 electron-rspack 多入口范例 |

## Migration Plan

不适用（新项目）。发布流程：`electron-builder` 打包 dmg/nsis/AppImage；版本化 `userData` 目录结构，未来 schema 变更时写迁移脚本。

## Open Questions

- 是否支持多 Provider 配置（多个 baseURL）？初版建议单 Provider，数据结构预留 `providers[]` 扩展位。
- 思考内容默认展开还是折叠？建议默认折叠，流式时自动展开。
- 删除会话是否需二次确认？建议是。
