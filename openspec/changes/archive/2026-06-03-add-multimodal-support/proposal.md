## Why

菜包 0.3.0 引入图片多模态与 S3 兼容对象存储。所有参数 **仅在运行时通过设置页配置并持久化**（不使用 `.env` / 环境变量作为配置源）。若启动或使用中检测到必要项未配置，须 **半透明遮罩** 阻断聊天等相关能力，引导用户进入 **左右分栏的设置页** 完成配置。

## What Changes

- `Message` + S3 上传；`image_url` 使用可访问 HTTP(S) URL
- **`AppSettings.objectStorage`**：endpoint、bucket、凭证等；保存即生效；**禁止**从 env 读取或种子导入
- **设置页重构**：左侧目录导航，右侧为当前分类的设置表单（Provider、对象存储、外观/聊天偏好等）
- **配置门禁（Setup Gate）**：聊天页在 Provider 或对象存储未就绪时显示半透明遮罩 + 说明 + 跳转设置（可定位到对应侧栏项）
- 设置页 **不被遮罩**，始终可编辑
- 模型 `vision` 门控；版本 **0.3.0**

## Capabilities

### New Capabilities

- `multimodal-messages`: 附件、S3 上传/删除、API 载荷、vision
- `object-storage-settings`: 运行时 S3 参数、加密凭证、测试连接
- `settings-navigation`: 设置页左右分栏结构与侧栏目录
- `app-setup-gate`: 未配置时的半透明遮罩与引导

### Modified Capabilities

- `chat-ui`: 门禁遮罩、Composer/气泡
- `chat-streaming`: 多模态 history
- `conversation-management`: 对象键引用与删会话清理
- `provider-settings`: 设置项归入新布局（需求级：表单位置变化，行为不变）

## Impact

- `src/renderer/pages/SettingsPage.tsx` → 壳层 + 分节子组件
- `src/renderer/components/SetupGateOverlay.tsx`（或同等）
- `src/renderer/pages/ChatPage.tsx`：遮罩替代/增强现有 `setup-hint`
- `src/shared/settings-readiness.ts`：`isProviderReady` / `isObjectStorageReady`
- 移除 design/tasks 中一切 env 相关项
