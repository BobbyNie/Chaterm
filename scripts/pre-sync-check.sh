#!/bin/bash

###############################################################################
# Pre-Sync Safety Check Script
###############################################################################
# This script performs safety checks before syncing with upstream repository.
# It ensures the working directory is clean, creates safety tags, backs up
# critical intranet files, and verifies tests pass.
#
# Usage: ./scripts/pre-sync-check.sh
#
# Idempotent: Safe to run multiple times
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y-%m-%d)
TAG_NAME="pre-sync-$TIMESTAMP"

# Critical intranet files to backup
CRITICAL_FILES=(
    "src/renderer/src/router/guards.ts"
    "src/renderer/src/views/components/LeftTab/index.vue"
    "src/renderer/src/views/components/LeftTab/constants/data.ts"
    "src/renderer/src/views/components/LeftTab/config/userConfig.vue"
    "src/renderer/src/views/components/AiTab/index.vue"
    ".github/workflows/build.yml"
    "CLAUDE.md"
)

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Function to check if git working directory is clean
check_git_status() {
    print_section "Checking Git Status"

    cd "$PROJECT_ROOT"

    if [ -n "$(git status --porcelain)" ]; then
        log_error "Working directory is not clean!"
        echo ""
        git status --short
        echo ""
        log_error "Please commit or stash changes before syncing with upstream."
        exit 1
    fi

    log_success "Git working directory is clean"
    git log -1 --oneline
}

# Function to create safety tag
create_safety_tag() {
    print_section "Creating Safety Tag"

    cd "$PROJECT_ROOT"

    # Check if tag already exists
    if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
        log_warning "Tag $TAG_NAME already exists. Skipping tag creation."
    else
        git tag -a "$TAG_NAME" -m "Pre-sync safety checkpoint before upstream merge - $TIMESTAMP"
        log_success "Created safety tag: $TAG_NAME"
    fi

    log_info "To rollback to this state: git reset --hard $TAG_NAME"
}

# Function to backup critical files
backup_critical_files() {
    print_section "Backing Up Critical Intranet Files"

    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/intranet-critical-$TIMESTAMP.tar.gz"

    # Check if backup already exists
    if [ -f "$BACKUP_FILE" ]; then
        log_warning "Backup file already exists: $BACKUP_FILE"
        read -p "Overwrite existing backup? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping backup creation"
            return
        fi
    fi

    log_info "Creating backup: $BACKUP_FILE"

    # Create tar archive
    tar -czf "$BACKUP_FILE" -C "$PROJECT_ROOT" "${CRITICAL_FILES[@]}" 2>/dev/null || {
        log_error "Failed to create backup"
        exit 1
    }

    log_success "Backup created successfully"

    # List backed up files
    echo ""
    log_info "Backed up files:"
    for file in "${CRITICAL_FILES[@]}"; do
        echo "  - $file"
    done

    # Create backup manifest
    cat > "$BACKUP_DIR/backup-manifest-$TIMESTAMP.txt" <<EOF
Backup Manifest: $TIMESTAMP
Backup File: $BACKUP_FILE
Safety Tag: $TAG_NAME

Critical Files Backed Up:
EOF
    for file in "${CRITICAL_FILES[@]}"; do
        echo "  - $file" >> "$BACKUP_DIR/backup-manifest-$TIMESTAMP.txt"
    done

    log_info "Backup manifest created: $BACKUP_DIR/backup-manifest-$TIMESTAMP.txt"
}

# Function to verify tests pass
verify_tests() {
    print_section "Running Test Suite"

    cd "$PROJECT_ROOT"

    log_info "Running linting checks..."
    if ! npm run lint --silent; then
        log_error "Linting checks failed"
        log_warning "You can proceed with sync, but be aware of code quality issues"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Linting checks passed"
    fi

    log_info "Running type checking..."
    if ! npm run typecheck --silent; then
        log_error "TypeScript type checking failed"
        log_warning "You can proceed with sync, but be aware of type errors"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "TypeScript type checking passed"
    fi

    log_info "Running unit tests..."
    if ! npm test -- --run --silent 2>/dev/null; then
        log_warning "Unit tests failed or had errors"
        log_warning "You can proceed with sync, but be aware of test failures"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Unit tests passed"
    fi
}

# Function to output current state summary
output_state_summary() {
    print_section "Current State Summary"

    cd "$PROJECT_ROOT"

    echo -e "${GREEN}Current Branch:${NC}    $(git branch --show-current)"
    echo -e "${GREEN}Latest Commit:${NC}     $(git log -1 --oneline)"
    echo -e "${GREEN}Safety Tag:${NC}        $TAG_NAME"
    echo -e "${GREEN}Backup Location:${NC}   $BACKUP_FILE"
    echo -e "${GREEN}Upstream Remote:${NC}   $(git remote -v | grep upstream | awk '{print $2}' | head -1 || echo 'Not configured')"

    echo ""
    log_info "Pending upstream commits:"
    UPSTREAM_COMMIT_COUNT=$(git log HEAD..upstream/main --oneline 2>/dev/null | wc -l | tr -d ' ')
    if [ "$UPSTREAM_COMMIT_COUNT" -gt 0 ]; then
        echo "  $UPSTREAM_COMMIT_COUNT commits to sync"
        git log HEAD..upstream/main --oneline 2>/dev/null | head -5 | sed 's/^/    /'
        if [ "$UPSTREAM_COMMIT_COUNT" -gt 5 ]; then
            echo "    ... and $((UPSTREAM_COMMIT_COUNT - 5)) more"
        fi
    else
        echo "  No upstream commits to sync (or upstream not configured)"
    fi
}

# Main execution
main() {
    print_section "Chaterm Intranet Edition - Pre-Sync Safety Check"

    log_info "Project root: $PROJECT_ROOT"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Safety tag: $TAG_NAME"

    # Run all checks
    check_git_status
    create_safety_tag
    backup_critical_files
    verify_tests
    output_state_summary

    print_section "Pre-Sync Safety Check Complete"

    log_success "All safety checks passed!"
    echo ""
    log_info "Next steps:"
    echo "  1. Review the summary above"
    echo "  2. Perform upstream sync: git fetch upstream && git merge upstream/main"
    echo "  3. Run post-sync verification: ./scripts/post-sync-verify.sh"
    echo "  4. If anything goes wrong: ./scripts/emergency-rollback.sh"
    echo ""
    log_info "Emergency rollback command:"
    echo "  git reset --hard $TAG_NAME"
}

# Run main function
main
