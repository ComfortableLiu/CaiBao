## Context

0.3.0 要求：**零 env 配置**；用户只在设置 UI 填写 Provider 与对象存储参数，写入 `settings.json`（凭证加密）。聊天依赖二者均就绪；对象存储负责图片上传。

当前聊天页在 Provider 未就绪时用 `setup-hint` 占位，无统一遮罩、无对象存储校验。设置页为单页长表单，需改为 **侧栏 + 内容区**。

## Goals / Non-Goals

**Goals:**

- 配置仅来自 `settings.get()` / `settings.save()`；主进程、渲染进程 **不读取** `CAIBAO_*` 等环境变量
- 就绪判定集中：`isProviderReady`、`isObjectStorageReady`；聊天页 `SetupGateOverlay` 半透明阻断
- 设置页左侧目录、右侧详情；从遮罩「前往设置」可带 `?section=` 或 state 定位侧栏项
- S3 Client 每次操作读最新 settings

**Non-Goals:**

- env 默认值、`.env.example` 中的 S3 项
- 遮罩挡住设置 Tab（设置必须始终可达）

## Decisions

### 1. 配置来源：仅运行时设置

- **禁止**：`process.env.CAIBAO_*`、`dotenv` 注入对象存储/Provider 默认值（除 Electron 自身与构建工具无关项）
- **默认**：`settings-migrate` 在 JSON 内写死空凭证与示例 endpoint 文本，**不视为已配置**
- `isObjectStorageReady`：`enabled === true` 且 `endpoint`、`bucket`、非空 AK/SK（persisted 解密后）均有效

`enabled` 仍为显式开关；0.3.0 聊天门禁要求对象存储就绪（多模态为版本核心能力）。

### 2. 配置门禁（Setup Gate）

组件：`SetupGateOverlay` 覆盖 **聊天主内容区**（含侧栏 + 消息区 + Composer 整体或 `chat-main` 整块），`position: fixed/absolute` + `backdrop-filter` + 半透明背景。

| 条件 | 遮罩文案要点 | 设置跳转 |
|------|----------------|----------|
| `!isProviderReady()` | 配置 API Key、同步并启用模型 | `section=provider` |
| Provider 就绪但 `!isObjectStorageReady()` | 配置对象存储 (S3) | `section=object-storage` |
| 二者就绪 | 无遮罩 | — |

- 遮罩上主按钮：**前往设置** → `onOpenSettings(section)`
- 设置 Tab 切换由 `App` 完成；**设置页内部不显示遮罩**
- 替换现有 `setup-hint` 块，统一视觉为 overlay

`isProviderReady`：沿用 `hasEnabledModel()` 逻辑（baseURL、apiKey、至少一个 enabled model）。

### 3. 设置页布局（左右结构）

```
┌─────────────────────────────────────────┐
│ 设置（标题可选）                          │
├──────────┬──────────────────────────────┤
│ 侧栏目录   │ 右侧内容区                    │
│ · 模型服务 │  <ProviderSettingsPanel />   │
│ · 对象存储 │  <ObjectStoragePanel />      │
│ · 聊天偏好 │  <ChatPreferencesPanel />    │
│   (主题/   │  (enableThinking/Search)    │
│    思考/   │                              │
│    搜索)   │                              │
└──────────┴──────────────────────────────┘
```

- 侧栏 `settings-nav-item`，选中态高亮；右侧单屏滚动
- 从 `SetupGateOverlay` 传入的 `initialSection` 选中对应项
- Provider 节保留 DashScope / OpenAI 分段切换与现有保存、同步逻辑（拆子组件，行为不变）
- 对象存储节：完整 S3 表单 + 测试连接
- **不**增加 env 配置输入项

### 4. 对象存储配置模型（不变，仅强调无 env）

`ObjectStorageSettings` 字段同前：`endpoint`, `region`, `bucket`, AK/SK 加密, `forcePathStyle`, `publicBaseUrl`, `keyPrefix`, `usePresignedUrls`, `presignedUrlExpirySeconds`, `enabled`。

`ObjectStorageService`：每次 `settings.get()` 构建 `S3Client`。

### 5. 多模态与 UI

- 遮罩存在时用户无法发消息（含纯文本）——简化实现；就绪后恢复
- Composer 附件：仅在 `isObjectStorageReady()` 且 vision 模型时可用（遮罩消失后）

### 6. URL 与 API

- 对象键、`image_url`、删除前缀逻辑同前版 design

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 仅想纯文本的用户也被挡 | 0.3.0 产品选择：对象存储为必配；后续可加「跳过图片」 |
| 换 bucket 后旧 URL 失效 | 文档说明 |
| 遮罩与侧栏 z-index | 遮罩仅挂在 `chat-layout` 内，不盖住顶栏「设置」Tab |

## Migration Plan

- 旧 `settings.json` 补 `objectStorage` 默认块（空凭证 = 未就绪 → 显示遮罩）
- 移除 proposal 历史中的 env 描述即可

## Open Questions

- 侧栏是否合并「模型服务」与「聊天偏好」为两项即可 —— 首版三项：模型服务、对象存储、聊天偏好
