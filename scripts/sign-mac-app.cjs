#!/usr/bin/env node
/**
 * 对 release 目录下已打包的 .app 重新 ad-hoc 签名（未走 electron-builder 时可用）。
 * 用法: node scripts/sign-mac-app.cjs [path/to/菜包.app]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectDir = path.resolve(__dirname, '..');
function findMacApps() {
  const releaseDir = path.join(projectDir, 'release');
  if (!fs.existsSync(releaseDir)) return [];

  const apps = [];
  for (const entry of fs.readdirSync(releaseDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('mac')) continue;
    const macDir = path.join(releaseDir, entry.name);
    for (const name of fs.readdirSync(macDir)) {
      if (name.endsWith('.app')) {
        apps.push(path.join(macDir, name));
      }
    }
  }
  return apps;
}

function signApp(appPath) {
  if (!fs.existsSync(appPath)) {
    throw new Error(`未找到应用: ${appPath}`);
  }

  console.log(`正在签名: ${appPath}`);

  const frameworksDir = path.join(appPath, 'Contents/Frameworks');
  if (fs.existsSync(frameworksDir)) {
    for (const name of fs.readdirSync(frameworksDir)) {
      const target = path.join(frameworksDir, name);
      execFileSync('codesign', ['--force', '--sign', '-', target], { stdio: 'inherit' });
    }
  }

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
  execFileSync('xattr', ['-cr', appPath], { stdio: 'inherit' });
  console.log(`签名完成: ${appPath}`);
}

function main() {
  const arg = process.argv[2];
  const targets = arg ? [path.resolve(arg)] : findMacApps();

  if (targets.length === 0) {
    console.error('未找到 .app，请先执行 npm run dist:mac 或传入路径');
    process.exit(1);
  }

  for (const app of targets) {
    signApp(app);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
