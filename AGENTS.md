# DayMate agent guide

## 产品定位

DayMate 是本地优先、温和、非评判的桌面陪伴应用。核心目标是帮助用户更容易开始，而不是监督或制造焦虑。

## 技术栈

Tauri 2、React、TypeScript、Vite、Zustand、Rust、SQLite。

## 修改规则

- 先梳理需求和验证标准，再编码。
- 用最少代码完成目标，不扩张范围，不改无关代码。
- 修改功能必须补测试；用户可见行为必须更新 `CHANGELOG.md`。
- 修改配置、架构或发布流程必须同步文档。
- 不使用 `any` 绕过类型；不跳过 TypeScript、Clippy 或测试。

## 隐私红线

- 不采集键盘输入、截图、聊天/网页/文档正文。
- 窗口标题默认关闭；所有记录能力可关闭。
- 不把 API Key、活动明细或任务全文写入日志。
- 不提交 SQLite、用户数据、密钥或本机绝对路径。

## 版本与提交

- Semantic Versioning；三个版本文件必须一致。
- 更新纪要维护在 `CHANGELOG.md`，正式发布不只依赖提交列表。
- Conventional Commits：`feat`、`fix`、`docs`、`refactor`、`test`、`build`、`ci`、`chore`。

## 发布

发布前运行 README 中全部检查；Tag `vX.Y.Z` 只从已通过 CI 的 `main` 创建。详细步骤见 `docs/release.md`。
