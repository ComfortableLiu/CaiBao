#!/usr/bin/env bash
# 清除 macOS 隔离属性，解决「已损坏，无法打开」误报（Gatekeeper / quarantine）
set -euo pipefail

resolve_app_path() {
  local input="${1:-}"
  if [[ -n "$input" ]]; then
    echo "$input"
    return
  fi
  if [[ -d "/Applications/菜包.app" ]]; then
    echo "/Applications/菜包.app"
    return
  fi
  local script_dir
  script_dir="$(cd "$(dirname "$0")" && pwd)"
  local candidate
  candidate="$(find "$script_dir/../release" -maxdepth 2 -name '菜包.app' 2>/dev/null | head -n 1)"
  if [[ -n "$candidate" ]]; then
    echo "$candidate"
    return
  fi
  echo ""
}

APP_PATH="$(resolve_app_path "${1:-}")"

if [[ -z "$APP_PATH" || ! -d "$APP_PATH" ]]; then
  echo "未找到应用。用法:"
  echo "  $0 [/path/to/菜包.app]"
  echo "  npm run fix:mac-gatekeeper"
  exit 1
fi

xattr -cr "$APP_PATH"
echo "已清除隔离属性: $APP_PATH"
echo ""
echo "请再次打开「菜包」。若仍提示无法打开："
echo "  1. 在 Finder 中右键应用 → 打开（首次需确认）"
echo "  2. 确认系统为 macOS 11.0 及以上（与 Electron 34 要求一致）"
echo "  3. 确认安装包为 Apple Silicon (arm64) 版本"
