#!/bin/bash

# Quick check for portable build artifacts in latest release
# Usage: ./quick-check-portable.sh

echo "═══════════════════════════════════════════════════════════════════"
echo "     Portable 构建产物快速检查"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Get latest release
LATEST_RELEASE=$(GH_REPO=BobbyNie/Chaterm gh release list --limit 1 --json tagName,name 2>/dev/null)
RELEASE_TAG=$(echo "$LATEST_RELEASE" | jq -r '.[0].tagName // empty')

if [ -z "$RELEASE_TAG" ]; then
  echo "❌ 未找到任何 Release"
  exit 1
fi

echo "📦 最新 Release: $RELEASE_TAG"
echo ""

# Check for portable executables
echo "🔍 检查构建产物:"
echo ""

FOUND_PORTABLE=false

GH_REPO=BobbyNie/Chaterm gh release view "$RELEASE_TAG" --json assets --jq -r '.assets[] | "\(.name)|\(.size)|\(.downloadCount)"' 2>/dev/null | while IFS='|' read -r asset_name asset_size download_count; do
  if echo "$asset_name" | grep -qE "\.exe$"; then
    if echo "$asset_name" | grep -qi "setup"; then
      type="安装版"
    else
      type="免安装版"
      FOUND_PORTABLE=true
    fi

    size_mb=$(echo "scale=2; $asset_size / 1024 / 1024" | bc)
    printf "   %-12s %s\n" "$type:" "$asset_name"
    printf "   %-12s 大小: %s MB | 下载: %s 次\n" "" "$size_mb" "$download_count"
    echo ""
  fi
done

echo "═══════════════════════════════════════════════════════════════════"
echo "🔗 Release 链接:"
echo "   https://github.com/BobbyNie/Chaterm/releases/tag/$RELEASE_TAG"
echo ""
echo "💡 验证要点:"
echo "   ✅ 是否包含免安装版 .exe 文件"
echo "   ✅ 文件大小是否合理 (通常 100-200 MB)"
echo "   ✅ 同时支持安装版和免安装版"
echo "═══════════════════════════════════════════════════════════════════"