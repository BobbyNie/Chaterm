#!/bin/bash

# Monitor Portable Build and Release Status
# Usage: ./monitor-portable-build.sh

echo "═══════════════════════════════════════════════════════════════════"
echo "     Chaterm Portable Build - 综合状态监控"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Get the latest run ID
echo "🔍 获取最新工作流信息..."
RUN_ID=$(GH_REPO=BobbyNie/Chaterm gh run list --limit 1 --json databaseId 2>&1 | jq -r '.[0].databaseId')

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "❌ 无法获取工作流ID，请确认已推送到GitHub"
  exit 1
fi

echo "✅ 监控工作流 ID: $RUN_ID"
echo ""

# Get commit info
COMMIT_SHA=$(GH_REPO=BobbyNie/Chaterm gh run view $RUN_ID --json headSha --jq -r '.headSha' 2>/dev/null)
COMMIT_MSG=$(GH_REPO=BobbyNie/Chaterm gh run view $RUN_ID --json headCommitMessage --jq -r '.headCommitMessage' 2>/dev/null)
echo "📝 提交信息: $COMMIT_MSG"
echo "🔗 提交SHA: $COMMIT_SHA"
echo ""

while true; do
  clear
  echo "═══════════════════════════════════════════════════════════════════"
  echo "     Chaterm Portable Build - 综合状态监控 (每 30 秒刷新)"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  echo "⏰ 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "🔄 工作流 ID: $RUN_ID"
  echo ""

  # Get workflow status
  STATUS=$(GH_REPO=BobbyNie/Chaterm gh run view $RUN_ID --json status --jq -r '.status' 2>/dev/null)
  CONCLUSION=$(GH_REPO=BobbyNie/Chaterm gh run view $RUN_ID --json conclusion --jq -r '.conclusion // "运行中"' 2>/dev/null)

  # Display status
  echo "📊 GitHub Actions 状态:"
  if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" = "success" ]; then
      echo "   ✅ 构建完成 - 成功"
    else
      echo "   ❌ 构建完成 - 失败"
    fi
  else
    echo "   🔄 构建中..."
  fi
  echo "   状态: $STATUS"
  echo "   结论: $CONCLUSION"
  echo ""

  # Get job statuses
  echo "📋 构建任务详情:"
  GH_REPO=BobbyNie/Chaterm gh run view $RUN_ID --json jobs --jq -r '.jobs[] | "\(.name)|\(.conclusion // "running")"' 2>/dev/null | while IFS='|' read -r job_name job_conclusion; do
    job_status=""
    case "$job_conclusion" in
      "success")
        job_status="✅"
        ;;
      "failure")
        job_status="❌"
        ;;
      "running"|"pending"|"queued")
        job_status="🔄"
        ;;
      *)
        job_status="⚠️"
        ;;
    esac
    echo "   $job_status $job_name"
  done
  echo ""

  # Check for releases if build is complete
  if [ "$STATUS" = "completed" ] && [ "$CONCLUSION" = "success" ]; then
    echo "🎁 检查 Release 状态..."

    # Get latest release
    LATEST_RELEASE=$(GH_REPO=BobbyNie/Chaterm gh release list --limit 1 --json tagName,name,createdAt,isLatest 2>/dev/null)
    RELEASE_TAG=$(echo "$LATEST_RELEASE" | jq -r '.[0].tagName // empty')
    RELEASE_NAME=$(echo "$LATEST_RELEASE" | jq -r '.[0].name // empty')
    RELEASE_DATE=$(echo "$LATEST_RELEASE" | jq -r '.[0].createdAt // empty')

    if [ -n "$RELEASE_TAG" ]; then
      echo "   ✅ Release 已创建"
      echo "   📦 标签: $RELEASE_TAG"
      echo "   📝 名称: $RELEASE_NAME"
      echo "   🕐 创建时间: $RELEASE_DATE"
      echo ""

      # Check for portable assets
      echo "🔍 检查 Portable 构建产物:"
      HAS_PORTABLE=false

      GH_REPO=BobbyNie/Chaterm gh release view "$RELEASE_TAG" --json assets --jq -r '.assets[] | "\(.name)|\(.size)"' 2>/dev/null | while IFS='|' read -r asset_name asset_size; do
        if echo "$asset_name" | grep -qE "\.exe$"; then
          # Check if it's a portable executable (no "setup" in name and reasonable size)
          if ! echo "$asset_name" | grep -qi "setup"; then
            HAS_PORTABLE=true
            size_mb=$(echo "scale=2; $asset_size / 1024 / 1024" | bc)
            echo "   ✅ $asset_name (${size_mb} MB)"
          fi
        fi
      done

      if ! $HAS_PORTABLE; then
        echo "   ⚠️  未发现明确的 portable 构建产物"
        echo "   💡 请检查 Release 中的所有 .exe 文件"
      fi
    else
      echo "   ⚠️  Release 尚未创建"
    fi
    echo ""

    echo "═══════════════════════════════════════════════════════════════════"
    echo "                  ✅ 监控完成！"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "🔗 查看详情:"
    echo "   Actions: https://github.com/BobbyNie/Chaterm/actions/runs/$RUN_ID"
    if [ -n "$RELEASE_TAG" ]; then
      echo "   Release: https://github.com/BobbyNie/Chaterm/releases/tag/$RELEASE_TAG"
    fi
    echo ""
    break
  fi

  if [ "$STATUS" = "completed" ] && [ "$CONCLUSION" != "success" ]; then
    echo "═══════════════════════════════════════════════════════════════════"
    echo "                  ❌ 构建失败"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "🔗 查看失败详情:"
    echo "   https://github.com/BobbyNie/Chaterm/actions/runs/$RUN_ID"
    echo ""
    echo "💡 运行以下命令查看详细错误:"
    echo "   ./view-build-errors.sh $RUN_ID"
    echo ""
    break
  fi

  echo "═══════════════════════════════════════════════════════════════════"
  echo "⏳ 等待 30 秒后刷新... (按 Ctrl+C 停止监控)"
  echo "═══════════════════════════════════════════════════════════════════"

  sleep 30
done