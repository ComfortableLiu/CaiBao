import path from 'node:path';
import { defineConfig } from '@rspack/cli';
import { HtmlRspackPlugin } from '@rspack/core';
import { sharedSwcRule, sharedResolve, rootDir, isProduction } from './rspack.shared.mjs';

export default defineConfig({
  name: 'renderer',
  entry: path.join(rootDir, 'src/renderer/index.tsx'),
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  output: {
    path: path.join(rootDir, 'dist/renderer'),
    filename: isProduction ? '[name].js' : 'index.js',
    chunkFilename: isProduction ? 'chunks/[name].js' : '[name].js',
    clean: true,
  },
  module: {
    rules: [
      sharedSwcRule(),
      {
        test: /\.css$/,
        type: 'css/auto',
      },
    ],
  },
  resolve: sharedResolve(),
  optimization: isProduction
    ? {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            markdown: {
              test: /[\\/]node_modules[\\/](react-markdown|remark-|rehype-|unified|micromark|katex|highlight\.js)/,
              name: 'markdown',
              chunks: 'all',
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
            },
          },
        },
      }
    : undefined,
  experiments: isProduction ? undefined : { lazyCompilation: true },
  plugins: [
    new HtmlRspackPlugin({
      template: path.join(rootDir, 'src/renderer/index.html'),
      title: '菜包',
    }),
  ],
  devServer: {
    port: 5173,
    hot: true,
    compress: false,
    historyApiFallback: true,
    client: {
      overlay: true,
    },
  },
});
