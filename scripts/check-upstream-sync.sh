#!/bin/bash

###############################################################################
# Upstream Sync Status Check (non-interactive)
###############################################################################
# Checks whether chaterm/Chaterm upstream has commits not yet merged into
# the current branch. Intended for scheduled automation (cron / Cloud Agent).
#
# Usage: ./scripts/check-upstream-sync.sh
# Exit codes:
#   0 - Already up to date (or upstream remote missing)
#   1 - Pending upstream commits available to merge
#   2 - Error (e.g. not a git repo)
###############################################################################

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UPSTREAM_URL="${UPSTREAM_URL:-https://github.com/chaterm/Chaterm.git}"
UPSTREAM_REMOTE="${UPSTREAM_REMOTE:-upstream}"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$PROJECT_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log_err "Not a git repository"
  exit 2
fi

if ! git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1; then
  log_info "Adding upstream remote: $UPSTREAM_REMOTE -> $UPSTREAM_URL"
  git remote add "$UPSTREAM_REMOTE" "$UPSTREAM_URL"
fi

log_info "Fetching $UPSTREAM_REMOTE/main ..."
git fetch "$UPSTREAM_REMOTE" main --quiet

CURRENT_BRANCH="$(git branch --show-current)"
CURRENT_SHA="$(git rev-parse HEAD)"
UPSTREAM_SHA="$(git rev-parse "$UPSTREAM_REMOTE/main")"
PENDING="$(git log HEAD.."$UPSTREAM_REMOTE/main" --oneline 2>/dev/null | wc -l | tr -d ' ')"

echo ""
echo "Branch:          $CURRENT_BRANCH"
echo "Current commit:  $(git log -1 --oneline HEAD)"
echo "Upstream commit: $(git log -1 --oneline "$UPSTREAM_REMOTE/main")"
echo "Pending commits: $PENDING"
echo ""

if [ "$PENDING" -gt 0 ]; then
  log_warn "Upstream has $PENDING commit(s) not yet merged"
  git log HEAD.."$UPSTREAM_REMOTE/main" --oneline | head -10 | sed 's/^/  /'
  if [ "$PENDING" -gt 10 ]; then
    echo "  ... and $((PENDING - 10)) more"
  fi
  exit 1
fi

if git merge-base --is-ancestor "$UPSTREAM_SHA" "$CURRENT_SHA"; then
  log_ok "Fully synced with upstream ($UPSTREAM_REMOTE/main @ ${UPSTREAM_SHA:0:8})"
else
  log_warn "Upstream tip is not an ancestor of HEAD; manual review recommended"
  exit 1
fi

exit 0
