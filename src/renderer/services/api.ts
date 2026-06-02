export function getApi() {
  if (!window.caibao) {
    throw new Error('CaiBao API not available');
  }
  return window.caibao;
}
