/**
 * electron-builder afterSign：对 .app 做完整 ad-hoc 签名（避免仅 linker-signed 导致「已损坏」）。
 */
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  const frameworksDir = path.join(appPath, 'Contents/Frameworks');
  if (fs.existsSync(frameworksDir)) {
    for (const name of fs.readdirSync(frameworksDir)) {
      const target = path.join(frameworksDir, name);
      execFileSync('codesign', ['--force', '--sign', '-', target], { stdio: 'inherit' });
    }
  }

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
};
