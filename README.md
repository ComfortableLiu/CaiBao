# 菜包

桌面 AI 聊天客户端（Electron + Rspack + React），兼容 OpenAI API 格式。

## 环境要求

- Node.js 20+
- npm 10+

## 开发

```bash
npm install
npm run dev
```

将启动：

1. 渲染进程 Rspack Dev Server（http://localhost:5173）
2. 主进程 / Preload 监听构建
3. Electron 窗口

## 构建与打包

```bash
npm run build    # 构建 main / preload / renderer
npm run dist     # electron-builder 安装包（输出到 release/）
```

### macOS：提示「已损坏，无法打开」

多数是 **Gatekeeper / 隔离属性** 或 **签名不完整**，不是 DMG 真损坏。

| 原因 | 说明 |
|------|------|
| `com.apple.quarantine` | 从浏览器、网盘、聊天工具下载后常见 |
| 仅 linker-signed | 未完整 ad-hoc 签名时，Apple Silicon 易误报「已损坏」 |
| 未公证 | 无 Apple 开发者公证时，他人 Mac 需首次「右键 → 打开」 |

**分发方请重新打包（含完整签名）：**

```bash
npm run dist:mac
```

打包流程会在 `electron-builder` 之后执行 `scripts/sign-mac-app.cjs`，对 `.app` 做 **ad-hoc 深度签名**（`codesign --deep --sign -`）。

**用户安装后任选一种：**

```bash
npm run fix:mac-gatekeeper
# 或
xattr -cr /Applications/菜包.app
```

或在 Finder 中 **右键「菜包」→ 打开**（首次需确认）。

**系统要求：** macOS **11.0+**（Electron 34）；M1/M2/M3 请使用 **arm64** 安装包（`npm run dist:mac` 默认 `--arm64`）。

**对外正式发布：** 需 Apple 开发者账号做 **Developer ID 签名 + 公证**（配置 `CSC_*`、`APPLE_ID` 等）。未公证包仍可能需要用户「右键打开」或清除隔离属性。

## 设置说明

1. 打开 **设置** 页，填写 **Base URL**（如 `https://api.openai.com/v1` 或 DeepSeek 等兼容地址）
2. 填写 **API Key**
3. 点击 **保存设置**，再点击 **同步模型列表**
4. 勾选要使用的模型
5. 在 **聊天** 页选择模型并开始对话

## 功能概览

- 多会话管理，首条消息后自动总结标题
- 流式输出思考过程（`reasoning_content`）与回复
- Markdown / 图片渲染，消息复制
- Token 用量展示（悬停查看明细）
- 聊天记录本地磁盘保存（`userData/caibao/`）

## 手动测试清单

- [ ] 配置 OpenAI / DeepSeek 等兼容端点并保存
- [ ] 同步模型列表并勾选模型
- [ ] 新建多会话、切换、删除（需二次点击确认）
- [ ] 发送消息，验证流式输出与停止生成
- [ ] 验证 Markdown、代码块、图片链接
- [ ] 悬停 Token 查看 prompt/completion/total
- [ ] 复制消息内容
- [ ] 重启应用后会话与消息恢复

## 技术栈

- Electron 34
- Rspack 1.x
- React 18 + TypeScript
- OpenAI SDK（渲染进程直连 API）
- Zustand、react-markdown
