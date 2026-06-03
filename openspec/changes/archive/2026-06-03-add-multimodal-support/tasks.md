## 1. 版本与类型

- [x] 1.1 `package.json` → `0.3.0`；`@aws-sdk/client-s3`（+ presigner 若需要）
- [x] 1.2 `ObjectStorageSettings`、持久化结构、`MessageAttachment`
- [x] 1.3 `src/shared/settings-readiness.ts`：`isProviderReady`、`isObjectStorageReady`（**不读 env**）
- [x] 1.4 IPC：对象存储 test/upload/delete/refresh；确认无 env 读取代码路径

## 2. 设置持久化

- [x] 2.1 `settings-migrate` 默认 `objectStorage` 块（空凭证 = 未就绪）
- [x] 2.2 `settings-service` 加解密 AK/SK
- [x] 2.3 **删除/禁止** 任何 `CAIBAO_*` / dotenv 对象存储或 Provider 种子逻辑

## 3. 对象存储服务

- [x] 3.1 `object-storage-service.ts`：运行时 `settings.get()` → `S3Client`
- [x] 3.2 upload / deleteByPrefix / buildUrl / presign / testConnection

## 4. 设置页左右布局

- [x] 4.1 重构 `SettingsPage`：侧栏 + 内容区壳层（`settings-navigation`）
- [x] 4.2 `ProviderSettingsPanel`（迁出现有 Provider 表单）
- [x] 4.3 `ObjectStorageSettingsPanel`（S3 表单 + 测试连接）
- [x] 4.4 `ChatPreferencesPanel`（主题、深度思考、联网搜索）
- [x] 4.5 `App` 支持 `openSettings(section)`；遮罩跳转带 `initialSection`
- [x] 4.6 `settings.css` 左右分栏样式

## 5. 配置门禁遮罩

- [x] 5.1 `SetupGateOverlay`：半透明 + 文案 + 前往设置
- [x] 5.2 `ChatPage`：Provider 未就绪 / 对象存储未就绪分别提示；替换 `setup-hint`
- [x] 5.3 顶栏「设置」Tab 始终可点；设置页无遮罩

## 6. 多模态与聊天

- [x] 6.1 `multimodal-content.ts`、`chat-store` 上传流程
- [x] 6.2 `Composer` / `MessageBubble`；vision + storage 门控（遮罩下不可用）
- [x] 6.3 删会话清 S3 前缀；retry 刷新 presigned

## 7. 文档与验证

- [x] 7.1 `TESTING.md`：遮罩引导、侧栏跳转、无 env、改设置后遮罩消失
- [x] 7.2 lint / build；手动：未配置见遮罩 → 设置保存 → 聊天可用
