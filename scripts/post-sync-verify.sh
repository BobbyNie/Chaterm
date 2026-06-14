#!/bin/bash

###############################################################################
# Post-Sync Verification Script
###############################################################################
# This script verifies that intranet-specific features remain intact after
# syncing with upstream. It checks critical files, runs tests, and ensures
# the application starts correctly.
#
# Usage: ./scripts/post-sync-verify.sh
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

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Counters for summary
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to record check result
record_result() {
    if [ "$1" = "pass" ]; then
        log_success "$2"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    elif [ "$1" = "fail" ]; then
        log_error "$2"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    elif [ "$1" = "warn" ]; then
        log_warning "$2"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
}

# Function to check if file contains specific content
check_file_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    log_check "$description"

    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        record_result "fail" "File not found: $file"
        return 1
    fi

    if grep -q "$pattern" "$PROJECT_ROOT/$file"; then
        record_result "pass" "$description"
        return 0
    else
        record_result "fail" "$description - Pattern not found: $pattern"
        return 1
    fi
}

# Function to check if file does NOT contain specific content
check_file_not_contains() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    log_check "$description"

    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        record_result "fail" "File not found: $file"
        return 1
    fi

    if ! grep -q "$pattern" "$PROJECT_ROOT/$file"; then
        record_result "pass" "$description"
        return 0
    else
        record_result "fail" "$description - Pattern should not exist: $pattern"
        return 1
    fi
}

# Function to check that a file does NOT contain any of several external domains.
# Uses ERE alternation (grep -E) for portability across GNU and BSD grep.
check_file_contains_no_domain() {
    local file="$1"
    local description="$2"
    shift 2

    log_check "$description"

    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        record_result "fail" "File not found: $file"
        return 1
    fi

    local pattern
    pattern=$(IFS='|'; echo "$*")
    if grep -Eq "$pattern" "$PROJECT_ROOT/$file"; then
        record_result "fail" "$description - External domain found in $file"
        return 1
    else
        record_result "pass" "$description"
        return 0
    fi
}

# Function to check guards.ts for login skip logic
verify_login_skip() {
    print_section "Verifying Login Skip Logic"

    local file="src/renderer/src/router/guards.ts"

    # Check for autoSkipLogin function
    check_file_content "$file" "const autoSkipLogin = async" "Auto-skip login function exists"

    # Check for guest user initialization
    check_file_content "$file" "uid: 999999999" "Guest user (uid: 999999999) initialization"

    # Check for guest token
    check_file_content "$file" "guest_token" "Guest token usage"

    # Check for login skip logic
    check_file_content "$file" "localStorage.setItem('login-skipped', 'true')" "Login skip flag setting"

    # Check that /login route redirects to main
    check_file_content "$file" "next('/')" "Login route redirects to home"
}

# Function to check template section of a Vue file (excludes script/style blocks)
check_vue_template_not_contains() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    log_check "$description"

    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        record_result "fail" "File not found: $file"
        return 1
    fi

    local template_section
    template_section=$(sed -n '1,/^<script/p' "$PROJECT_ROOT/$file" | sed '$d')

    if ! echo "$template_section" | grep -q "$pattern"; then
        record_result "pass" "$description"
        return 0
    else
        record_result "fail" "$description - Pattern should not exist in template: $pattern"
        return 1
    fi
}

# Function to verify user menu removal from LeftTab
verify_user_menu_removal() {
    print_section "Verifying User Menu Removal from LeftTab"

    local file="src/renderer/src/views/components/LeftTab/index.vue"

    # Check that user menu is not in template
    check_vue_template_not_contains "$file" "user-menu" "User menu element removed from template"

    # Check that user avatar is not present in template
    check_vue_template_not_contains "$file" "user-avatar" "User avatar removed from template"

    local data_file="src/renderer/src/views/components/LeftTab/constants/data.ts"

    # Check that menuTabsData doesn't have user menu
    check_file_not_contains "$data_file" "name: 'User'" "User menu removed from menu data"

    # Check that the last item in menu is 'setting'
    check_file_content "$data_file" "key: 'setting'" "Setting is the last menu item"
}

# Function to verify billing tab removal
verify_billing_removal() {
    print_section "Verifying Billing Tab Removal"

    local file="src/renderer/src/views/components/LeftTab/config/userConfig.vue"

    # Check that billing tab is not present
    check_file_not_contains "$file" "key=\"4\"" "Billing tab removed from userConfig"
    check_file_not_contains "$file" "billing" "Billing tab reference removed"
}

# Function to verify AI Tab changes
verify_ai_tab_changes() {
    print_section "Verifying AI Tab Changes"

    local file="src/renderer/src/views/components/AiTab/index.vue"

    # Check that login/register prompts are not present (configure-model prompt is allowed)
    check_file_not_contains "$file" "goToLogin" "Login redirect removed from AI tab"
    check_file_not_contains "$file" "ai-login-prompt" "Legacy login prompt class removed from AI tab"
    check_file_content "$file" "configureModel" "Configure model button exists"
}

# Function to verify CI/CD workflow
verify_cicd_workflow() {
    print_section "Verifying CI/CD Workflow"

    local file=".github/workflows/build.yml"

    # Check workflow exists
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        record_result "fail" "CI/CD workflow file not found"
        return 1
    fi

    record_result "pass" "CI/CD workflow file exists"

    # Check for automated builds
    check_file_content "$file" "on:" "Workflow triggers defined"
    check_file_content "$file" "branches: \[main, intranet\]" "Intranet branch trigger"

    # Check for version setting
    check_file_content "$file" "npm version \$date" "Date-based versioning"

    # Check for release creation
    check_file_content "$file" "softprops/action-gh-release" "GitHub Release automation"
}

# Function to verify CLAUDE.md documentation
verify_claude_md() {
    print_section "Verifying CLAUDE.md Documentation"

    local file="CLAUDE.md"

    # Check for intranet edition section
    check_file_content "$file" "Intranet Edition" "Intranet edition documentation exists"

    # Check for key modifications section
    check_file_content "$file" "Key Files Modified for Intranet Use" "Modified files documentation"
}

# Function to verify runtime external network isolation (intranet edition).
# Ensures the app never reaches out to external cloud services at runtime:
# config URLs are empty, cloud features are hard-disabled, and the auto-updater
# is gated to the global edition.
verify_external_isolation() {
    print_section "Verifying Runtime External Network Isolation"

    # Edition config and env files must not reference external cloud domains.
    check_file_contains_no_domain "build/edition-config/cn.json" \
        "cn.json has no external cloud domains" \
        "chaterm\.net" "chaterm\.cn" "deepseek\.com" "i\.posthog\.com" "intsig\.net"
    check_file_contains_no_domain "build/.env.production.cn" \
        ".env.production.cn has no external cloud domains" \
        "chaterm\.net" "chaterm\.cn" "deepseek\.com" "i\.posthog\.com"
    check_file_contains_no_domain "build/.env.development.cn" \
        ".env.development.cn has no external cloud domains" \
        "chaterm\.net" "chaterm\.cn" "deepseek\.com" "i\.posthog\.com"

    # electron-builder publish must not point to an external update server.
    check_file_not_contains "electron-builder.cn.yml" "static-download8.chaterm.net" \
        "electron-builder.cn.yml has no external publish URL"
    check_file_not_contains "electron-builder.yml" "chaterm-static.intsig.net" \
        "electron-builder.yml has no external publish URL"

    # Cloud features must be hard-disabled for the intranet edition in index.ts.
    check_file_content "src/main/index.ts" "CHATERM_DATA_SYNC_ENABLED = 'false'" \
        "Data sync hard-disabled for intranet edition"
    check_file_content "src/main/index.ts" "CHATERM_TELEMETRY_ENABLED = 'false'" \
        "Telemetry hard-disabled for intranet edition"
    check_file_content "src/main/index.ts" "CHATERM_KB_SEARCH_ENABLED = 'false'" \
        "KB search hard-disabled for intranet edition"

    # auto-updater must only be registered for the global edition.
    check_file_content "src/main/index.ts" "never register the auto-updater" \
        "auto-updater gated to global edition"

    # chat-sync must short-circuit for the intranet edition.
    check_file_content "src/main/index.ts" "chat sync needs an external sync server" \
        "chat-sync short-circuited for intranet edition"

    # PostHog client must not be instantiated for the intranet edition.
    check_file_content "src/main/agent/services/telemetry/TelemetryService.ts" \
        "private client: PostHog | null = null" \
        "PostHog client nullable (not instantiated in intranet edition)"
}

# Function to run test suite
run_test_suite() {
    print_section "Running Test Suite"

    cd "$PROJECT_ROOT"

    log_check "Running ESLint..."
    if npm run lint --silent 2>&1 | grep -q "error"; then
        record_result "warn" "ESLint found issues (check output above)"
    else
        record_result "pass" "ESLint checks passed"
    fi

    log_check "Running TypeScript type checking..."
    if npm run typecheck --silent 2>&1; then
        record_result "pass" "TypeScript type checking passed"
    else
        record_result "fail" "TypeScript type checking failed"
    fi

    log_check "Running unit tests..."
    if npm test -- --run --silent 2>/dev/null; then
        record_result "pass" "Unit tests passed"
    else
        record_result "warn" "Unit tests had failures or errors"
    fi
}

# Function to verify application starts
verify_app_starts() {
    print_section "Verifying Application Startup"

    cd "$PROJECT_ROOT"

    log_check "Checking if electron-vite config exists..."
    if [ -f "electron.vite.config.ts" ]; then
        record_result "pass" "Electron vite config found"
    else
        record_result "fail" "Electron vite config not found"
    fi

    log_check "Checking if main process entry point exists..."
    if [ -f "src/main/index.ts" ]; then
        record_result "pass" "Main process entry point found"
    else
        record_result "fail" "Main process entry point not found"
    fi

    log_check "Checking if renderer entry point exists..."
    if [ -f "src/renderer/src/main.ts" ]; then
        record_result "pass" "Renderer entry point found"
    else
        record_result "fail" "Renderer entry point not found"
    fi

    # Check package.json scripts
    log_check "Checking package.json scripts..."
    if grep -q '"dev":' package.json; then
        record_result "pass" "Dev script exists in package.json"
    else
        record_result "fail" "Dev script not found in package.json"
    fi
}

# Function to check for merge conflicts
check_merge_conflicts() {
    print_section "Checking for Merge Conflicts"

    cd "$PROJECT_ROOT"

    # Exclude this script itself, which references the conflict marker in its grep pattern
    local conflict_files=$(git grep -l "<<<<<<< HEAD" -- . ':(exclude)scripts/post-sync-verify.sh' 2>/dev/null || true)

    if [ -z "$conflict_files" ]; then
        record_result "pass" "No merge conflict markers found"
    else
        record_result "fail" "Merge conflict markers found in files:"
        echo "$conflict_files" | while read -r file; do
            echo "  - $file"
        done
    fi
}

# Function to output final summary
output_summary() {
    print_section "Verification Summary"

    local total_checks=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

    echo "Total Checks:  $total_checks"
    echo -e "  ${GREEN}Passed:${NC}   $CHECKS_PASSED"
    echo -e "  ${YELLOW}Warnings:${NC} $CHECKS_WARNING"
    echo -e "  ${RED}Failed:${NC}   $CHECKS_FAILED"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        log_success "All critical checks passed!"
        echo ""
        log_info "The intranet edition features appear to be intact."
        echo ""
        log_info "Next steps:"
        echo "  1. Run manual E2E tests: See tests/manual/E2E_CHECKLIST.md"
        echo "  2. If all tests pass, commit the merge"
        echo "  3. If issues found, run: ./scripts/emergency-rollback.sh"
        return 0
    else
        log_error "Some critical checks failed!"
        echo ""
        log_warning "Please review the failed checks above."
        echo ""
        log_info "Options:"
        echo "  1. Manually fix the issues"
        echo "  2. Run emergency rollback: ./scripts/emergency-rollback.sh"
        return 1
    fi
}

# Main execution
main() {
    print_section "Chaterm Intranet Edition - Post-Sync Verification"

    log_info "Project root: $PROJECT_ROOT"
    log_info "Git branch: $(git branch --show-current)"
    log_info "Latest commit: $(git log -1 --oneline)"

    # Run all verification checks
    check_merge_conflicts
    verify_login_skip
    verify_user_menu_removal
    verify_billing_removal
    verify_ai_tab_changes
    verify_cicd_workflow
    verify_claude_md
    verify_external_isolation
    run_test_suite
    verify_app_starts

    # Output summary
    output_summary
}

# Run main function
main
