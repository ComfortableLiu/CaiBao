import path from 'node:path';
import { defineConfig } from '@rspack/cli';
import { sharedSwcRule, sharedResolve, rootDir, isProduction } from './rspack.shared.mjs';

export default defineConfig({
  name: 'main',
  entry: path.join(rootDir, 'src/main/index.ts'),
  target: 'electron-main',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  output: {
    path: path.join(rootDir, 'dist/main'),
    filename: 'index.js',
  },
  module: { rules: [sharedSwcRule()] },
  resolve: sharedResolve(),
  externals: [
    ({ request }, callback) => {
      if (!request) return callback();
      if (request.startsWith('.') || request.startsWith('/')) return callback();
      if (request.startsWith('@shared/') || request.startsWith('@/')) return callback();
      // 必须用 commonjs2，否则会变成 module.exports = electron（运行时未定义）
      callback(null, `commonjs2 ${request}`);
    },
  ],
  node: { __dirname: false, __filename: false },
});
