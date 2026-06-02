## Why

用户需要一款本地运行的桌面 AI 助手，交互体验接近市面主流 IM（如豆包桌面版），同时不绑定单一云厂商：通过运行时配置 OpenAI 兼容接口，即可接入任意模型服务。当前仓库尚无应用实现，需从零搭建 Electron 客户端，并满足流式对话、本地持久化与多会话管理等核心体验。

## What Changes

- 新增 **Electron 桌面应用**（主进程负责本地存储，**渲染进程发起 LLM 请求**），提供设置页与聊天页两大主界面
- 新增 **Provider 设置**：用户配置 `baseURL`、`apiKey`；调用 `/v1/models` 同步模型列表；勾选可用模型
- 新增 **聊天体验**：多会话侧边栏；IM 式消息流；流式展示思考过程（reasoning）与最终回复；Markdown 与图片渲染
- 新增 **消息元数据**：每条消息展示时间、所用模型、Token 总量；悬停显示 prompt/completion/total 等明细
- 新增 **会话生命周期**：首条用户消息发送后自动生成会话标题；聊天记录落盘；支持删除会话与单条消息复制
- 新增 **本地存储层**：对话、消息、设置持久化到用户数据目录（非云端）

## Capabilities

### New Capabilities

- `provider-settings`: OpenAI 兼容 API 配置、模型列表同步与启用模型选择
- `chat-streaming`: 流式请求/响应、思考与正文分块展示、Token 统计与悬停详情
- `chat-ui`: IM 式布局、Markdown/图片渲染、消息复制与时间/模型展示
- `conversation-management`: 多会话、自动标题、本地持久化与删除

### Modified Capabilities

（无：仓库尚无既有 spec）

## Impact

- **新建代码库**：`electron` + 前端框架（React + **Rspack**）、TypeScript
- **依赖**：`electron`、`openai` SDK 或自封装 fetch（兼容 OpenAI Chat Completions 流式）、Markdown 渲染库、本地 JSON/SQLite 存储
- **系统**：读写 macOS/Windows/Linux 用户数据目录；`apiKey` 需安全存储（如 `safeStorage` 或系统钥匙串）
- **无后端服务**：所有逻辑在客户端完成；`/v1/models` 与 `/v1/chat/completions` 由**渲染进程**直连用户配置的 LLM API；主进程不代理 HTTP
