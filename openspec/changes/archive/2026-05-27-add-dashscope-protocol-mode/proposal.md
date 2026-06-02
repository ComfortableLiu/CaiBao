## Why

当前设置页仅暴露「OpenAI 兼容」一种接入方式，用户需自行填写 DashScope 的 Base URL 才能使用通义千问；对国内用户而言路径不直观，且易与通用 OpenAI 代理混淆。应用已在流式解析中适配 DashScope 特有字段（如 `search_info`、`enable_thinking`），应在配置层提供一等公民的 **DashScope 协议模式**（推荐、预设端点），并与通用 OpenAI 兼容模式 **互斥切换**，避免两套凭证同时生效造成调用歧义。

## What Changes

- 新增 **Provider 协议模式**：`dashscope`（推荐，默认）与 `openai-compatible`，用户在设置页通过分段控件或单选切换，**同一时刻仅一种模式生效**
- **DashScope 模式**：预设北京地域 Base URL（`https://dashscope.aliyuncs.com/compatible-mode/v1`），用户主要填写 DashScope API Key；可选地域/端点变体（如新加坡、弗吉尼亚）以下拉或预设项呈现，无需手填完整 URL
- **OpenAI 兼容模式**：保留现有可编辑 `baseURL` + `apiKey` 行为，用于 OpenAI、自建网关及其他兼容服务
- 持久化结构扩展：记录当前 `providerMode`；各模式 **独立保存** 各自的 `apiKey`（加密）与模式相关字段（DashScope 地域、OpenAI 的 baseURL），切换模式时加载对应快照，不合并为两套同时有效的运行时配置
- 模型同步与聊天调用根据 **当前激活模式** 解析 endpoint 与凭证；`isConfigured` 等校验随模式变化
- 设置页 UI：DashScope 置于推荐位（默认选中、视觉强调）；切换模式时表单字段联动显示/隐藏
- **BREAKING（迁移）**：既有仅含 `baseURL`/`apiKey` 的用户，首次升级时若 `baseURL` 匹配 DashScope 兼容地址则迁移为 `dashscope` 模式，否则迁移为 `openai-compatible`；默认新用户为 `dashscope`

## Capabilities

### New Capabilities

（无：行为归入既有 provider-settings 能力扩展）

### Modified Capabilities

- `provider-settings`: 增加互斥的协议模式选择、DashScope 推荐预设与分模式凭证存储；调整配置/同步/校验相关需求

## Impact

- `src/shared/types.ts`：`AppSettings` / `SettingsPersisted` / `SettingsSaveInput` 增加 `providerMode` 及分模式字段
- `src/main/storage/settings-service.ts`：读写与迁移逻辑、分模式 `encryptedApiKey`
- `src/renderer/pages/SettingsPage.tsx`：模式切换 UI、DashScope 推荐区、条件表单
- `src/renderer/stores/settings-store.ts`：`isConfigured`、默认值
- `src/renderer/services/llm/provider-service.ts`、`chat-service.ts`：按模式解析 `baseURL`
- `openspec/specs/provider-settings/spec.md`：合入变更后的正式需求（由本 change 的 delta spec 驱动）
