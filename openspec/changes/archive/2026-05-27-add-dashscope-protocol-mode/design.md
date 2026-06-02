## Context

CaiBao 渲染进程通过 `openai` SDK + 用户配置的 `baseURL`/`apiKey` 调用 LLM。设置页目前仅展示「OpenAI 兼容」表单；聊天层已对 DashScope 流式字段（`search_info`、`enable_thinking` 等）做了解析。用户希望将 **DashScope** 作为推荐协议模式，与 **OpenAI 兼容** 互斥切换，且两套配置分别保存、运行时只激活其一。

DashScope 官方提供 OpenAI 兼容路径（如 `https://dashscope.aliyuncs.com/compatible-mode/v1`），与本项目现有 SDK 调用方式一致；「DashScope 协议」在本变更中指 **产品级模式 + 预设端点 + 分模式凭证**，而非引入第二套非 OpenAI 的 HTTP 客户端（除非后续单独立项原生 Generation API）。

## Goals / Non-Goals

**Goals:**

- 设置页提供 `dashscope` | `openai-compatible` 互斥切换，DashScope 为默认与推荐展示
- 各模式独立持久化 API Key（加密）及模式专属字段；切换时仅加载当前模式快照参与 `isConfigured` 与 API 调用
- DashScope 模式通过地域预设解析 `baseURL`，用户无需手填完整 URL
- 升级迁移：根据既有 `baseURL` 推断初始 `providerMode`

**Non-Goals:**

- 同时启用两种协议并联调（明确禁止）
- 实现 DashScope 非 OpenAI 兼容的原生 REST 协议（如旧版 `generation` 非兼容路径）
- 主进程代理 HTTP；仍由渲染进程直连
- 多账号、多 Key 轮换

## Decisions

### 1. 协议模式枚举与运行时解析

- 新增 `ProviderMode = 'dashscope' | 'openai-compatible'`，存入 `SettingsPersisted.providerMode`，默认 `'dashscope'`。
- 新增 `resolveProviderConfig(settings)`（renderer 共享 util）：根据 `providerMode` 返回当前生效的 `{ baseURL, apiKey }`。
  - `dashscope`：`baseURL = DASHSCOPE_ENDPOINTS[region]`（常量表，默认 `cn-beijing`）。
  - `openai-compatible`：`baseURL = settings.openaiCompatible.baseURL`（迁移后字段名，见下）。
- **理由**：聊天与同步模型仅依赖统一结构，避免各处 `if (mode)` 重复。

### 2. 持久化形状（分模式、互斥激活）

```ts
interface SettingsPersisted {
  providerMode: ProviderMode;
  dashscope: {
    region: DashScopeRegion; // 'cn-beijing' | 'ap-southeast-1' | 'us-east-1' ...
    encryptedApiKey: string | null;
    availableModels: string[];
    enabledModelIds: string[];
  };
  openaiCompatible: {
    baseURL: string;
    encryptedApiKey: string | null;
    availableModels: string[];
    enabledModelIds: string[];
  };
  theme?: ThemeMode;
  enableThinking?: boolean;
}
```

- 顶层 **不再** 使用单一 `baseURL`/`encryptedApiKey`/`availableModels`（**BREAKING** 存储结构）。
- `enableThinking`、`theme` 保持全局（与协议无关）。
- 切换 `providerMode` 时 **不删除** 另一模式已存数据，仅改变 `resolveProviderConfig` 来源。
- **理由**：满足「可切换、不能同时设置」——同时有效指运行时，非删除历史配置。

**备选**：单套 `baseURL`+`apiKey` 切换时清空另一套 → 用户切回需重填，体验差，不采用。

### 3. DashScope 地域预设

| `region` key     | baseURL |
|------------------|---------|
| `cn-beijing`（默认） | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `ap-southeast-1` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| `us-east-1`      | `https://dashscope-us.aliyuncs.com/compatible-mode/v1` |

- UI：推荐卡片 + 地域下拉；不暴露自由编辑 URL（除非后续加「高级」）。
- **理由**：与官方文档一致，降低配置错误。

### 4. 设置页 UI

- 顶部 **协议切换**：分段按钮或 radio，`dashscope` 带「推荐」徽章并默认选中。
- 条件渲染：
  - DashScope：地域 + API Key + 同步/保存
  - OpenAI 兼容：Base URL + API Key + 同步/保存
- 切换模式时：表单绑定当前模式字段；`availableModels` / `enabledModelIds` 从当前模式子对象读写（各模式独立模型列表，避免 ID 冲突）。
- **理由**：互斥配置在交互上可见；推荐位满足产品要求。

### 5. 迁移（`settings-service` 读取时）

若检测到旧版扁平结构（存在顶层 `baseURL` 且无 `providerMode`）：

1. 若 `baseURL` 归一化后匹配 `DASHSCOPE_ENDPOINTS` 任一值 → `providerMode = 'dashscope'`，对应 region，Key/模型迁入 `dashscope` 子对象。
2. 否则 → `providerMode = 'openai-compatible'`，迁入 `openaiCompatible`。
3. 新用户默认 `providerMode = 'dashscope'`，`dashscope.region = 'cn-beijing'`。

写回时仅使用新结构。

### 6. LLM 调用层

- `chat-store`、`provider-service.syncModels`、`isConfigured` 一律通过 `resolveProviderConfig` 取凭证。
- DashScope 模式下仍可发送 `enable_thinking` / `enable_search`（与现网一致）；OpenAI 兼容模式对非 DashScope 端点可能忽略未知字段（SDK/服务端行为不变）。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 存储结构变更导致旧数据无法读取 | 一次性迁移函数 + 单测覆盖典型旧 JSON |
| 两模式各自模型列表，切换后聊天模型为空 | 切换时若当前 `enabledModelIds` 为空，提示用户同步模型；保留上次该模式的列表 |
| OpenAI 兼容用户误以为 DashScope 模式可填任意 URL | DashScope 模式不展示 URL 输入，文档/占位说明仅支持百炼 Key |
| 地域选错导致 401/404 | 同步失败时展示明确错误文案 |

## Migration Plan

1. 部署新版本后首次 `getSettings()` 执行迁移并写回新结构。
2. 回滚：旧版读新结构会失败——若需回滚，应保留迁移前备份或版本门控（Electron 本地数据，风险可接受）。
3. 无服务端变更。

## Open Questions

- 是否在 DashScope 模式提供「中国香港」等新端点预设（文档有变体 URL）——首版可仅三地域，后续按文档增补常量。
- `enable_thinking` 是否在 OpenAI 兼容模式下对非 DashScope 端点隐藏 UI 开关——建议保持全局开关，调用时由服务端忽略未知参数。
