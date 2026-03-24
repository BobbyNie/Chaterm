#!/bin/bash

###############################################################################
# Emergency Rollback Script
###############################################################################
# This script performs an emergency rollback to the pre-sync state by resetting
# to the safety tag and restoring backed up critical files.
#
# Usage: ./scripts/emergency-rollback.sh [--force]
#
# Options:
#   --force    Skip confirmation prompts
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

# Parse arguments
FORCE=false
if [ "$1" = "--force" ]; then
    FORCE=true
fi

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

# Function to display warning
show_warning() {
    print_section "EMERGENCY ROLLBACK WARNING"

    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  ⚠️  THIS WILL DISCARD ALL LOCAL CHANGES ⚠️               ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  This script will:                                         ║${NC}"
    echo -e "${RED}║  - Reset git to the pre-sync safety tag                   ║${NC}"
    echo -e "${RED}║  - Discard all commits since the safety tag               ║${NC}"
    echo -e "${RED}║  - Restore critical intranet files from backup            ║${NC}"
    echo -e "${RED}║  - Reset dependencies if needed                            ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  This action CANNOT be undone easily!                     ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to get latest safety tag
get_safety_tag() {
    cd "$PROJECT_ROOT"

    # Get the most recent pre-sync tag
    local tag=$(git tag -l "pre-sync-*" --sort=-v:refname | head -1)

    if [ -z "$tag" ]; then
        log_error "No safety tag found!"
        log_info "Available tags:"
        git tag -l | sed 's/^/  /'
        return 1
    fi

    echo "$tag"
}

# Function to find latest backup
get_latest_backup() {
    local latest_backup=$(ls -t "$BACKUP_DIR"/intranet-critical-*.tar.gz 2>/dev/null | head -1)

    if [ -z "$latest_backup" ]; then
        log_error "No backup file found in $BACKUP_DIR"
        return 1
    fi

    echo "$latest_backup"
}

# Function to confirm rollback
confirm_rollback() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    echo ""
    read -p "Are you sure you want to proceed with rollback? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

# Function to perform git reset
perform_git_reset() {
    print_section "Performing Git Reset"

    cd "$PROJECT_ROOT"

    # Get safety tag
    local tag=$(get_safety_tag) || exit 1

    log_info "Safety tag: $tag"
    log_info "Current commit: $(git log -1 --oneline)"
    log_info "Target commit: $(git log $tag -1 --oneline)"

    # Check if we're already at the safety tag
    if [ "$(git rev-parse HEAD)" = "$(git rev-parse $tag)" ]; then
        log_warning "Already at safety tag, skipping git reset"
        return 0
    fi

    # Perform hard reset
    log_info "Performing hard reset to $tag..."
    git reset --hard "$tag"
    log_success "Reset to safety tag: $tag"
}

# Function to restore backup files
restore_backup_files() {
    print_section "Restoring Backup Files"

    local backup_file=$(get_latest_backup) || exit 1

    log_info "Backup file: $backup_file"

    # Verify backup exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Extract backup
    log_info "Extracting backup files..."
    tar -xzf "$backup_file" -C "$PROJECT_ROOT"

    if [ $? -eq 0 ]; then
        log_success "Backup files restored successfully"
    else
        log_error "Failed to extract backup"
        return 1
    fi

    # List restored files
    echo ""
    log_info "Restored files:"
    tar -tzf "$backup_file" | sed 's/^/  /'
}

# Function to reset dependencies if needed
reset_dependencies() {
    print_section "Checking Dependencies"

    cd "$PROJECT_ROOT"

    # Check if package.json was modified
    if git diff HEAD package.json | grep -q .; then
        log_warning "package.json was modified"
        read -p "Reinstall dependencies? (y/n): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Running patch script and reinstalling dependencies..."
            node scripts/patch-package-lock.js
            rm -rf node_modules package-lock.json
            npm install
            log_success "Dependencies reinstalled"
        else
            log_info "Skipping dependency reinstall"
        fi
    else
        log_info "package.json unchanged, skipping dependency reinstall"
    fi
}

# Function to verify rollback
verify_rollback() {
    print_section "Verifying Rollback"

    cd "$PROJECT_ROOT"

    local tag=$(get_safety_tag) || exit 1

    # Check current commit
    local current_commit=$(git rev-parse HEAD)
    local tag_commit=$(git rev-parse $tag)

    if [ "$current_commit" = "$tag_commit" ]; then
        log_success "Git state verified: At safety tag"
    else
        log_error "Git state verification failed!"
        return 1
    fi

    # Check critical files exist
    local critical_files=(
        "src/renderer/src/router/guards.ts"
        "src/renderer/src/views/components/LeftTab/index.vue"
        ".github/workflows/build.yml"
    )

    for file in "${critical_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            log_success "File exists: $file"
        else
            log_warning "File missing: $file"
        fi
    done
}

# Function to output rollback summary
output_summary() {
    print_section "Rollback Complete"

    cd "$PROJECT_ROOT"

    local tag=$(get_safety_tag) || exit 1

    log_success "Successfully rolled back to: $tag"
    echo ""
    log_info "Current state:"
    echo "  Branch:     $(git branch --show-current)"
    echo "  Commit:     $(git log -1 --oneline)"
    echo "  Safety Tag: $tag"
    echo ""
    log_info "Next steps:"
    echo "  1. Review the changes: git log $tag..HEAD (if any commits exist)"
    echo "  2. Run tests: npm test"
    echo "  3. Start dev server: npm run dev"
    echo "  4. Investigate what went wrong with the sync"
    echo ""
    log_warning "Note: Any uncommitted changes before the rollback have been discarded"
}

# Main execution
main() {
    print_section "Chaterm Intranet Edition - Emergency Rollback"

    # Show warning
    show_warning

    # Confirm rollback
    confirm_rollback

    # Perform rollback
    perform_git_reset
    restore_backup_files
    reset_dependencies
    verify_rollback
    output_summary
}

# Run main function
main
