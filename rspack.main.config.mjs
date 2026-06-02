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
  externals: {
    electron: 'commonjs electron',
  },
  node: { __dirname: false, __filename: false },
});
