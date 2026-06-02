import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

export const rootDir = __dirname;
export const isProduction = isProd;

export function sharedSwcRule() {
  return {
    test: /\.tsx?$/,
    exclude: [/node_modules/],
    loader: 'builtin:swc-loader',
    options: {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        transform: { react: { runtime: 'automatic' } },
      },
    },
    type: 'javascript/auto',
  };
}

export function sharedResolve() {
  return {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  };
}
