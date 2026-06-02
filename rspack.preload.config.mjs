import path from 'node:path';
import { defineConfig } from '@rspack/cli';
import { sharedSwcRule, sharedResolve, rootDir, isProduction } from './rspack.shared.mjs';

export default defineConfig({
  name: 'preload',
  entry: path.join(rootDir, 'src/preload/index.ts'),
  target: 'electron-preload',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  output: {
    path: path.join(rootDir, 'dist/preload'),
    filename: 'index.js',
  },
  module: { rules: [sharedSwcRule()] },
  resolve: sharedResolve(),
  externals: {
    electron: 'commonjs electron',
  },
});
