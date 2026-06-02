## 1. 类型与共享工具

- [x] 1.1 在 `src/shared/types.ts` 增加 `ProviderMode`、`DashScopeRegion` 及分模式 `SettingsPersisted` / `AppSettings` 结构
- [x] 1.2 新增 `src/shared/provider-config.ts`（或 renderer util）：`DASHSCOPE_ENDPOINTS` 常量表与 `resolveProviderConfig(settings)` 函数
- [x] 1.3 更新 `SettingsSaveInput` 与 IPC 类型，支持按模式保存字段

## 2. 存储与迁移

- [x] 2.1 重构 `src/main/storage/settings-service.ts`：读写新嵌套结构、分模式加密/解密 API Key
- [x] 2.2 实现旧版扁平 `baseURL`/`encryptedApiKey` 一次性迁移（DashScope URL 匹配 → `dashscope`，否则 → `openai-compatible`）
- [x] 2.3 新用户默认值：`providerMode = 'dashscope'`，`region = 'cn-beijing'`

## 3. 状态与 LLM 调用

- [x] 3.1 更新 `settings-store`：`isConfigured`、load/save 映射到 `resolveProviderConfig` 与当前模式子对象
- [x] 3.2 更新 `provider-service.syncModels` 与 `chat-store` 发送逻辑，统一使用 `resolveProviderConfig` 的 `baseURL`/`apiKey`
- [x] 3.3 确认各模式独立的 `availableModels` / `enabledModelIds` 在切换与同步时行为正确

## 4. 设置页 UI

- [x] 4.1 增加协议模式切换控件（DashScope 推荐位 + 徽章，OpenAI 兼容次之）
- [x] 4.2 DashScope 模式：地域选择 + API Key + 保存/同步（隐藏 Base URL 手填）
- [x] 4.3 OpenAI 兼容模式：保留现有 Base URL + API Key 表单
- [x] 4.4 切换模式时联动表单与模型列表；补充 `settings.css` 样式

## 5. 验证

- [x] 5.1 手动验证：DashScope 模式保存、同步模型、发起聊天
- [x] 5.2 手动验证：切换到 OpenAI 兼容后使用另一套 Key/URL，再切回 DashScope 配置仍保留
- [x] 5.3 手动验证：从旧版设置 JSON 升级迁移后模式与凭证正确
