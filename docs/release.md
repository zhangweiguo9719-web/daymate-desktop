# GitHub 发布流程

版本遵守 Semantic Versioning：修复为 PATCH，兼容新增为 MINOR，不兼容变更为 MAJOR。

## 发布前

1. 确认 `main` 最新，`CHANGELOG.md` 的 `[Unreleased]` 已完整。
2. 把 Unreleased 内容移动到 `## [X.Y.Z] - YYYY-MM-DD`。
3. 同步 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`。
4. 运行全部检查。

```powershell
git checkout main
git pull origin main
git checkout -b release/v0.1.0
npm ci
npm run version:check
npm run lint
npm run typecheck
npm run test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
git add .
git commit -m "chore: prepare v0.1.0 release"
git push -u origin release/v0.1.0
```

合并 PR 后在 `main` 打 Tag：

```powershell
git checkout main
git pull origin main
git tag v0.1.0
git push origin v0.1.0
```

## 自动流程

`.github/workflows/release.yml` 会验证版本、运行前端与 Rust 检查、在 `windows-latest` 构建安装包，并创建 GitHub Release。Release Notes 的正式更新内容来自 `CHANGELOG.md`，提交列表只作补充。

## 人工验收

- 在干净 Windows 10/11 环境安装。
- 完成首次引导、创建任务、专注 5 分钟。
- 使用两个应用，离开电脑后核对统计。
- 验证暂停记录、标题默认关闭、删除活动数据。
- 验证托盘退出和卸载。
