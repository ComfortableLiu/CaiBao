## 1. 项目脚手架（Rspack）

- [x] 1.1 初始化 Electron + React + TypeScript 项目（`apps/desktop` 或仓库根目录），安装 `@rspack/core`、`@rspack/cli`、`@rspack/dev-server`
- [x] 1.2 编写 Rspack 多入口配置：`rspack.main.config.mjs`（electron-main）、`rspack.preload.config.mjs`（electron-preload）、`rspack.renderer.config.mjs`（web + devServer）
- [x] 1.3 配置 SWC 编译 TS/TSX、`resolve.alias`（`@/`）、生产/开发 `mode` 与 output 目录
- [x] 1.4 配置 npm scripts：`dev`（renderer devServer + main/preload watch + electron）、`build`（三目标 production build）、`dist`（electron-builder）
- [x] 1.5 配置 ESLint/Prettier
- [x] 1.6 搭建 `src/main`、`src/preload`、`src/renderer` 目录结构；typed IPC 仅覆盖 `storage:*` 与 `settings:*`（不含 chat 流式通道）

## 2. 主进程基础设施

- [x] 2.1 实现 `StorageService`：读写 `userData` 下 settings 与 `conversations/{id}.json`
- [x] 2.2 实现 `SettingsService`：baseURL 明文存储、apiKey 经 `safeStorage` 加密
- [x] 2.3 定义 Conversation / Message / Usage / Settings 的 TypeScript 类型与 JSON schema 校验

## 3. 渲染进程 LLM 与设置（provider-settings）

- [x] 3.1 实现 `src/renderer/services/llm/createLlmClient.ts`（OpenAI SDK + baseURL）
- [x] 3.2 实现 `ProviderService`（渲染进程）：`models.list()` 同步与错误处理
- [x] 3.3 IPC：`settings:get`、`settings:save`（主进程加密存 apiKey；返回解密凭据供内存使用）
- [x] 3.4 `settingsStore`（Zustand）：baseURL、apiKey、availableModels、enabledModelIds
- [x] 3.5 设置页 UI：baseURL、apiKey 表单、保存校验、同步按钮与加载态
- [x] 3.6 设置页 UI：模型列表多选勾选，经 IPC 持久化 `enabledModelIds` 与 `availableModels`
- [x] 3.7 未配置或未启用模型时，聊天页展示引导跳转设置

## 4. 会话管理（conversation-management）

- [x] 4.1 IPC：会话 CRUD（list、get、create、delete）与消息追加/更新
- [x] 4.2 侧边栏会话列表组件：新建、切换、删除确认
- [x] 4.3 首条消息发送后由渲染进程异步调用 LLM 生成标题并更新侧边栏
- [x] 4.4 标题生成失败时使用首条消息文本截断作为 fallback
- [x] 4.5 应用启动时恢复会话列表与上次打开会话

## 5. 流式聊天（chat-streaming，渲染进程）

- [x] 5.1 实现 `ChatService`（渲染进程）：`chat.completions.create({ stream: true })` 与 `AbortController`
- [x] 5.2 流式适配层：归一化 `content` 与 `reasoning_content` delta，直接更新 Zustand 草稿消息
- [x] 5.3 流结束：解析 `usage`，经 IPC 持久化完整 assistant 消息
- [x] 5.4 中止生成：渲染进程 abort，保留已流式部分内容并持久化

## 6. 聊天 UI（chat-ui）

- [x] 6.1 三栏/两栏布局：会话列表 + 消息区 + 底部输入框（Enter 发送、Shift+Enter 换行）
- [x] 6.2 消息气泡组件：用户/助手样式区分，流式打字效果
- [x] 6.3 集成 `react-markdown` + `remark-gfm` + `rehype-sanitize` 渲染正文与代码块
- [x] 6.4 支持 Markdown 图片展示与外链安全策略
- [x] 6.5 思考过程可折叠区块（有 reasoning 时显示，无则隐藏）
- [x] 6.6 消息 footer：时间、模型名、Token 总量；悬停 Tooltip 展示明细
- [x] 6.7 每条消息复制按钮与 clipboard 成功提示
- [x] 6.8 流式时底部自动滚动；用户上滚时暂停自动跟随
- [x] 6.9 聊天页模型下拉（仅显示已启用模型）

## 7. 集成与打包

- [x] 7.1 路由或 Tab：设置页 ↔ 聊天页导航
- [x] 7.2 端到端手动测试清单：配置 DeepSeek/OpenAI 兼容端点、同步模型、多会话、删除、复制
- [x] 7.3 配置 `electron-builder` 生成 macOS/Windows/Linux 安装包
- [x] 7.4 编写 README：环境要求、开发命令、设置说明
