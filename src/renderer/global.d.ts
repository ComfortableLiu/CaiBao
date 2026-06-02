import type { CaibaoApi } from '../preload/index';

declare global {
  interface Window {
    caibao: CaibaoApi;
  }
}

export {};
