# 开发说明

## 前置环境

- Windows 10/11
- Node.js 20 或更高版本
- Rust stable MSVC
- Visual Studio 2022：`Desktop development with C++`
- Windows 10/11 SDK
- WebView2 Runtime

Tauri 官方 Windows 环境要求同时包含 Microsoft C++ Build Tools 与 WebView2。

## 安装与运行

```powershell
git clone https://github.com/<owner>/daymate-desktop.git
cd daymate-desktop
npm ci
npm run tauri dev
```

只调前端时使用 `npm run dev`，此时 `native.ts` 返回安全空数据，不会采集桌面活动。

`npm run desktop:dev` 会自动发现 Visual Studio、Windows SDK 和仓库同级 Rust 工具链，并把当前开发数据写到 `D:\DayMate\data`。也可以通过 `DAYMATE_DATA_DIR` 为其他环境指定自定义目录。

## 质量检查

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run version:check
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## 开发约束

- 用户可见改动必须更新 `CHANGELOG.md`。
- 不采集键盘输入、截图、正文内容。
- 不在日志中记录 API Key、窗口标题或任务全文。
- 数据库结构只通过迁移前进，不删除重建用户数据库。
- 新系统能力先放 Rust，再通过 `native.ts` 暴露给前端。
