# Chaterm Intranet Edition - Manual E2E Test Checklist

## Overview

This checklist provides step-by-step manual testing procedures to verify that all intranet-specific features work correctly after an upstream sync.

**Purpose:** Ensure critical intranet functionality remains intact after merging upstream changes.

**When to use:** Run this checklist after completing `scripts/post-sync-verify.sh` and before committing the upstream sync.

---

## Pre-Test Setup

### Environment Preparation
- [ ] Ensure Node.js 22.x is installed
- [ ] Ensure dependencies are installed: `npm install`
- [ ] Ensure database is clean or use test database
- [ ] Have SSH host credentials ready for testing (if available)
- [ ] Have K8s cluster credentials ready (if applicable)

### Starting the Application
- [ ] Run `npm run dev` to start development server
- [ ] Wait for application window to open
- [ ] Open DevTools for debugging (Cmd+Option+I / Ctrl+Shift+I)

---

## Test 1: Application Startup and Login Skip

### Expected Behavior
Application should start directly to main interface without showing login page.

### Verification Steps
1. [ ] Launch application using `npm run dev`
2. [ ] Verify login page is NOT displayed
3. [ ] Verify application redirects to main interface (workspace view)
4. [ ] Check DevTools Console for errors (should be none)
5. [ ] Check localStorage contains:
   - `login-skipped: "true"`
   - `ctm-token: "guest_token"`
6. [ ] Verify user info is set:
   - `uid: 999999999`
   - `username: "guest"`
   - `name: "Guest"`

### Success Criteria
- Login page never appears
- Main interface loads within 5 seconds
- No console errors related to authentication
- Guest user properly initialized

### Failure Actions
- Check `src/renderer/src/router/guards.ts` for `autoSkipLogin` function
- Verify guest user initialization code is present
- Check for any route guard conflicts

---

## Test 2: Guest User Initialization

### Expected Behavior
Guest user (uid: 999999999) should be initialized and database should be created.

### Verification Steps
1. [ ] Open DevTools Application tab
2. [ ] Check localStorage for userInfo object
3. [ ] Verify userInfo contains:
   - `uid: 999999999`
   - `username: "guest"`
   - `name: "Guest"`
   - `email: "guest@chaterm.ai"`
   - `token: "guest_token"`
4. [ ] Check that database initialization succeeded (no errors in console)
5. [ ] Verify user data can be stored and retrieved

### Success Criteria
- Guest user object is complete
- Database initialization completes without errors
- User can interact with application features

### Failure Actions
- Check `autoSkipLogin` function in guards.ts
- Verify database initialization logic
- Check for any API errors in console

---

## Test 3: Sidebar Menu Verification

### Expected Behavior
Sidebar should NOT contain user menu or user avatar. Only show standard navigation items.

### Verification Steps
1. [ ] Locate left sidebar menu
2. [ ] Verify menu items from top to bottom:
   - [ ] Hosts (workspace)
   - [ ] Assets
   - [ ] Files
   - [ ] Snippets
   - [ ] Knowledge
   - [ ] Extensions
   - [ ] AI
   - [ ] Kubernetes
   - [ ] Setting (bottom)
3. [ ] Verify NO user menu items present:
   - [ ] No "User" menu item
   - [ ] No user avatar/profile picture
   - [ ] No login/logout buttons
4. [ ] Verify last item is "Setting" (not user menu)
5. [ ] Check `src/renderer/src/views/components/LeftTab/constants/data.ts` to confirm

### Success Criteria
- Exactly 9 menu items (8 main + 1 setting)
- No user-related menu items
- Setting menu is at the bottom
- All menu items are clickable

### Failure Actions
- Check `src/renderer/src/views/components/LeftTab/constants/data.ts`
- Verify `menuTabsData` array doesn't include user menu
- Check `src/renderer/src/views/components/LeftTab/index.vue` template

---

## Test 4: Settings Tabs Verification

### Expected Behavior
Settings panel should NOT include billing tab.

### Verification Steps
1. [ ] Click on "Setting" icon in bottom-left sidebar
2. [ ] Verify settings panel opens on right side
3. [ ] Check tabs list (left side of settings panel):
   - [ ] General
   - [ ] Terminal
   - [ ] Extensions
   - [ ] Models
   - [ ] AI Preferences
   - [ ] MCP
   - [ ] Skills
   - [ ] Rules
   - [ ] Shortcuts
   - [ ] Trusted Devices
   - [ ] Privacy
   - [ ] About
4. [ ] Verify NO billing tab exists:
   - [ ] No "Billing" or "Subscription" tab
   - [ ] No payment-related options
5. [ ] Click through each tab to verify they load

### Success Criteria
- All expected tabs are present
- Billing tab is completely removed
- All tabs load without errors
- Settings can be saved and persisted

### Failure Actions
- Check `src/renderer/src/views/components/LeftTab/config/userConfig.vue`
- Verify billing tab (`key="4"`) is removed
- Check for any billing-related components

---

## Test 5: AI Tab Functionality

### Expected Behavior
AI tab should show "Configure Model" button when no models are available, NOT login prompts.

### Verification Steps
1. [ ] Click on "AI" icon in sidebar
2. [ ] Verify AI tab opens
3. [ ] If no models configured:
   - [ ] Verify "Configure Model" button is displayed
   - [ ] Verify NO login prompts appear
   - [ ] Verify NO "Sign in to use AI" messages
   - [ ] Click "Configure Model" button
   - [ ] Verify it opens Settings > Models tab
4. [ ] If models are configured:
   - [ ] Verify AI chat interface loads
   - [ ] Verify you can send messages
   - [ ] Verify AI responses appear

### Success Criteria
- No login prompts in AI tab
- "Configure Model" button works correctly
- AI chat works when models are configured
- No authentication errors in console

### Failure Actions
- Check `src/renderer/src/views/components/AiTab/index.vue`
- Verify login prompt components are removed
- Check for conditional rendering based on model availability

---

## Test 6: Basic Terminal Functionality

### Expected Behavior
Terminal should work normally for SSH connections and local commands.

### Verification Steps
1. [ ] Click on "Hosts" in sidebar
2. [ ] Verify host list loads
3. [ ] If SSH host available:
   - [ ] Click on a host to connect
   - [ ] Verify terminal opens
   - [ ] Type `ls` and press Enter
   - [ ] Verify output appears
   - [ ] Type `pwd` and verify current directory
4. [ ] Check terminal features:
   - [ ] Copy/paste works (Cmd+C/Cmd+V or Ctrl+C/Ctrl+V)
   - [ ] Terminal scroll works
   - [ ] Tab completion works
5. [ ] Close terminal and verify no errors

### Success Criteria
- Terminal opens without errors
- Commands execute correctly
- Output displays properly
- No authentication errors appear

### Failure Actions
- Check xterm.js integration
- Verify SSH connection logic
- Check for any permission errors

---

## Test 7: File Manager (Optional)

### Expected Behavior
File manager should work for connected hosts.

### Verification Steps
1. [ ] Click on "Files" in sidebar
2. [ ] If connected to host:
   - [ ] Verify file list loads
   - [ ] Navigate to a directory
   - [ ] Verify files display
   - [ ] Try uploading a small file
   - [ ] Verify upload succeeds
3. [ ] Check file operations:
   - [ ] Create folder
   - [ ] Rename file
   - [ ] Delete file (use test file)

### Success Criteria
- File manager opens without errors
- File operations work correctly
- No authentication-related errors

### Failure Actions
- Check SFTP integration
- Verify file operation handlers
- Check for permission errors

---

## Test 8: Kubernetes Integration (If Applicable)

### Expected Behavior
K8s integration should be accessible but may show "under development" message.

### Verification Steps
1. [ ] Click on "Kubernetes" in sidebar
2. [ ] Verify K8s panel opens or shows development message
3. [ ] If configured:
   - [ ] Verify cluster connection
   - [ ] Check namespace list
   - [ ] View pod list
4. [ ] Verify no authentication errors appear

### Success Criteria
- K8s menu item is present
- Panel opens without crashing
- No login/authentication prompts

### Failure Actions
- Check K8s component implementation
- Verify API integration

---

## Test 9: AI Features Integration

### Expected Behavior
AI features should work without requiring user login.

### Verification Steps
1. [ ] Go to Settings > Models
2. [ ] Add a test model (e.g., Ollama or local model)
3. [ ] Configure model settings
4. [ ] Go to AI tab
5. [ ] Send a test message: "Hello, can you hear me?"
6. [ ] Verify AI responds
7. [ ] Try AI command completion in terminal (if available)
8. [ ] Verify no login prompts appear

### Success Criteria
- Models can be configured
- AI chat works
- AI terminal features work
- No authentication required

### Failure Actions
- Check AI provider configuration
- Verify API integration
- Check for auth-related code in AI features

---

## Test 10: Application Performance

### Expected Behavior
Application should be responsive and performant.

### Verification Steps
1. [ ] Monitor CPU usage (should be < 20% when idle)
2. [ ] Monitor memory usage (should be reasonable for Electron app)
3. [ ] Check startup time (should be < 10 seconds)
4. [ ] Navigate between tabs (should be instant)
5. [ ] Open multiple terminals (should handle gracefully)
6. [ ] Check for memory leaks (use DevTools Memory profiler)

### Success Criteria
- Application remains responsive
- No excessive resource usage
- No memory leaks detected
- Smooth UI interactions

### Failure Actions
- Check for memory leaks in components
- Verify event listeners are properly cleaned up
- Check for unnecessary re-renders

---

## Test Results Summary

### Overall Status
- [ ] **All tests passed** - Ready to commit upstream sync
- [ ] **Some tests failed** - Review failures and fix or rollback
- [ ] **Critical failures** - Execute emergency rollback immediately

### Failed Tests Details
Record any test failures here:

1. Test Name: ______________________
   - Issue: ______________________
   - Action Taken: __________________

2. Test Name: ______________________
   - Issue: ______________________
   - Action Taken: __________________

3. Test Name: ______________________
   - Issue: ______________________
   - Action Taken: __________________

---

## Post-Test Actions

### If All Tests Pass
1. [ ] Commit the upstream sync with descriptive message
2. [ ] Run full test suite: `npm test`
3. [ ] Create PR if needed
4. [ ] Update documentation

### If Tests Fail
1. [ ] Document all failures
2. [ ] Decide if issues are fixable or require rollback
3. [ ] If fixable: fix issues and re-run tests
4. [ ] If not fixable: run `./scripts/emergency-rollback.sh`
5. [ ] Investigate root cause of failures

### Emergency Rollback
If critical failures occur:
```bash
./scripts/emergency-rollback.sh
```

---

## Notes and Observations

Use this section to record any observations, issues, or suggestions during testing:

- _________________________________________________________________________
- _________________________________________________________________________
- _________________________________________________________________________
- _________________________________________________________________________
- _________________________________________________________________________

---

## Test Execution Log

- **Date:** ______________________
- **Tester:** ______________________
- **Upstream Commit Range:** ______________________
- **Time Started:** ______________________
- **Time Completed:** ______________________
- **Total Duration:** ______________________

---

## Checklist Version

Version: 1.0.0
Last Updated: 2026-03-24
For: Chaterm Intranet Edition
