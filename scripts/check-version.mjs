import fs from "node:fs";

const packageVersion = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const tauriVersion = JSON.parse(fs.readFileSync("src-tauri/tauri.conf.json", "utf8")).version;
const cargo = fs.readFileSync("src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargo.match(/^version = "([^"]+)"/m)?.[1];

if (!cargoVersion || packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
  console.error({ packageVersion, tauriVersion, cargoVersion });
  process.exit(1);
}

console.log(`DayMate versions are consistent: ${packageVersion}`);
