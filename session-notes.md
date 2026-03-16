# Session Notes - Chaterm Intranet Edition

## Project Background and Goal

**Project:** Chaterm Intranet Edition - A fork of [chaterm/Chaterm](https://github.com/chaterm/Chaterm) modified for internal network deployment without cloud service dependencies.

**Primary Goals:**

1. Remove all cloud-dependent features (login, billing, user management)
2. Set up automated CI/CD with GitHub Actions for Windows and macOS builds
3. Use date-based versioning (yyyy.MM.dd) and auto-create GitHub Releases
4. Document all changes for future maintenance

---

## Files Already Modified

### 1. `.github/workflows/build.yml` (NEW - 202 lines)

**Purpose:** Complete CI/CD workflow for automated builds

**Key Features:**

- Dual-platform support: Windows (windows-latest) and macOS (macos-14)
- Date-based versioning from environment variable
- Automatic GitHub Release creation
- Memory optimization with `NODE_OPTIONS: "--max-old-space-size=6144"`

**Jobs:**

- `build-windows`: Builds Windows installer (NSIS)
- `build-mac-arm64`: Builds macOS ZIP for arm64 and x64

### 2. `src/renderer/src/router/guards.ts`

**Purpose:** Auto-skip login for intranet use

**Key Changes:**

```typescript
const autoSkipLogin = async () => {
  localStorage.removeItem('ctm-token')
  localStorage.removeItem('jms-token')
  localStorage.removeItem('userInfo')
  localStorage.setItem('login-skipped', 'true')
  localStorage.setItem('ctm-token', 'guest_token')
  const guestUserInfo = {
    uid: 999999999,
    username: 'guest',
    name: 'Guest',
    email: 'guest@chaterm.ai',
    token: 'guest_token'
  }
  setUserInfo(guestUserInfo)
  const api = window.api as any
  const dbResult = await api.initUserDatabase({ uid: 999999999 })
  return dbResult.success
}
```

### 3. `src/renderer/src/views/components/LeftTab/index.vue`

**Purpose:** Removed user menu from sidebar

**Key Changes:**

- Removed user avatar dropdown menu
- Removed login/logout functionality from UI

### 4. `src/renderer/src/views/components/LeftTab/constants/data.ts`

**Purpose:** Removed user menu item

**Original Content:** Had user menu entry
**Modified:** Removed user-related menu item from `menuTabsData` array

### 5. `src/renderer/src/views/components/LeftTab/config/userConfig.vue`

**Purpose:** Removed billing tab from settings

**Key Changes:**

- Removed Billing tab and its import
- Remaining tabs: General, Terminal, Extensions, Models, AI Preferences, MCP, Skills, Rules, Shortcuts, Trusted Devices, Privacy, About, Documentation

### 6. `src/renderer/src/views/components/AiTab/index.vue`

**Purpose:** Removed login prompt from AI tab

**Key Changes:**

- When no models available, only shows "Configure Model" button
- Removed login/registration prompt

### 7. `electron-builder.cn.yml`

**Purpose:** Build configuration for China edition

**Key Changes:**

```yaml
mac:
  target:
    - target: zip
      arch:
        - x64
        - arm64
```

- Switched to ZIP-only format for macOS to avoid DMG build issues

### 8. Documentation Files Updated

- `README.md` - Added intranet edition notes
- `README_zh.md` - Added intranet edition notes (Chinese)
- `CLAUDE.md` - Comprehensive documentation of all modifications

---

## Problems Solved

### 1. JavaScript Heap Out of Memory

**Error:** Build failed with "JavaScript heap out of memory"
**Solution:** Moved `NODE_OPTIONS: "--max-old-space-size=6144"` to job-level environment variable

### 2. Version Update Notes Missing

**Error:** Release notes check failing
**Cause:** npm normalizes version (2026.03.07 -> 2026.3.7)
**Solution:** Read version from package.json instead of environment variable in release script

### 3. DMG Build Failure

**Error:** `hdiutil: attach failed` on macOS
**Solution:** Switched to ZIP-only format for macOS builds in `electron-builder.cn.yml`

### 4. macOS Runner Not Supported

**Error:** macos-13 runner not available
**Solution:** Changed to macos-14 runner (Apple Silicon)

### 5. Apple Malware Verification Warning

**Issue:** macOS shows "Apple could not verify 'Chaterm CN' is free of malware"
**Workaround:** User can bypass in System Settings > Privacy & Security
**Note:** This is expected for unsigned applications

---

## Current Progress

### Completed Tasks

- [x] GitHub Actions CI/CD pipeline working
- [x] Login skip implemented (auto-login as guest user)
- [x] User menu removed from sidebar
- [x] Billing tab removed from settings
- [x] AI tab login prompt removed (only shows "Configure Model")
- [x] Documentation updated (README, CLAUDE.md)
- [x] Fork analysis completed (compared with upstream)
- [x] Branch renamed from `boc_intranet` to `intranet`
- [x] `intranet` branch merged into `main`
- [x] All changes pushed to GitHub

### Current State

- Main branch: `main`
- All intranet modifications are merged
- GitHub Action should be triggered automatically on push

---

## Next Steps to Continue

### Immediate

1. Verify GitHub Action runs successfully on the merged `main` branch
2. Download and test the built artifacts

### Future Enhancements (Optional)

1. **Code Signing:** Add Apple Developer certificate for macOS to avoid malware warnings
2. **Windows Signing:** Add code signing for Windows builds
3. **Auto-update Server:** Set up internal update server for intranet deployment
4. **Configuration:** Add environment-based configuration for internal AI model endpoints
5. **Upstream Rebase:** Monitor upstream repository for bug fixes and consider rebasing

### Maintenance

1. Monitor upstream repository: https://github.com/chaterm/Chaterm
2. Review upstream changes for valuable bug fixes
3. Keep documentation updated as changes are made

---

## Key Technical Details

### Guest User Configuration

- **UID:** 999999999
- **Username:** guest
- **Email:** guest@chaterm.ai
- **Token:** guest_token

### Build Commands

```bash
# Development
npm run dev:cn

# Build for production
npm run build:cn
npm run build:unpack:cn
npm run build:win:cn
npm run build:mac:cn
```

### Edition Configuration

- Config files: `build/edition-config/cn.json`, `build/edition-config/global.json`
- Build config: `electron-builder.cn.yml`

---

## Session Date

2026-03-09

---

## Sync Log: 2026-03-16

### Overview

Synced upstream repository (chaterm/Chaterm) updates to the intranet fork, resolved merge conflicts, and updated documentation.

### Upstream Changes Synced

| Category | Changes |
|----------|---------|
| Electron | Upgraded to 41.0.2 for better stability |
| Localization | Added Arabic (ar-AR) language support |
| Agent | Added `read_file` tool and large tool-output offloading |
| AI Conversation | Support `/` trigger for command popup |
| File Management | Refactored folder upload/download/transfer flow |
| Terminal | Fixed display issues with light theme background switching |
| Dependencies | Multiple dependency updates |

### Files Modified During Sync

1. **Merge Conflict Resolution:**
   - `src/renderer/src/views/components/LeftTab/index.vue` - Kept intranet's user menu removal, excluded cloud service imports
   - `src/renderer/src/views/components/Ssh/sshConnect.vue` - Accepted upstream ANSI utilities, removed cloud-only `useDeviceStore`

2. **TypeScript Fix:**
   - `src/renderer/src/views/components/Ssh/sshConnect.vue` - Removed unused `useDeviceStore` import (cloud service dependency)

3. **Electron Update Fix:**
   - `scripts/verify-ffmpeg.js` - Updated ffmpeg.dll hash for Electron 41.0.2
   - Old hash: `BE2661FF1473E6A297121986C5100D6EC28FADEB3C74DD0407E4E3CD558C44C5`
   - New hash: `2EE497A8D8917861683337C10CDA719EE019F5483B509EFFC02A0390A52E8947`

4. **Documentation Updates:**
   - `README.md` - Added prominent fork notice, detailed comparison table, quick start guide
   - `README_zh.md` - Added corresponding Chinese documentation
   - `README_ja.md` - Added corresponding Japanese documentation
   - `resources/update-notes.json` - Added v2026.03.16 and v2026.03.09 release notes for intranet edition

### Commits Made

1. `31939326` - Merge upstream/main with intranet modifications
2. `031d3f8a` - fix: remove unused useDeviceStore import for intranet edition
3. `a6b6ac10` - fix: update ffmpeg.dll hash for Electron version 41.0.2
4. `cba2707c` - docs: enhance README and update notes for intranet edition
5. `04fe7ba0` - docs: add intranet edition details to Japanese README

### GitHub Actions Results

| Workflow | Status | Duration |
|----------|--------|----------|
| Tests | Passed | ~15 min |
| Security Scan | Passed | ~2 min |
| Build (macOS ARM64) | Passed | 28m57s |
| Build (Windows) | Passed | 9m24s |
| Create Release | Passed | 1m18s |

### Release Created

- **Version:** v2026.03.16
- **URL:** https://github.com/BobbyNie/Chaterm/releases/tag/v2026.03.16
- **Artifacts:**
  - `chaterm-2026.3.16-cn-setup-x64.exe` (Windows)
  - `chaterm-2026.3.16-cn-macos-arm64.zip` (macOS Apple Silicon)
  - `chaterm-2026.3.16-cn-macos-x64.zip` (macOS Intel)

### Features Excluded from Sync

The following upstream features were excluded as they require cloud services:

- Chat Sync V2 (`src/main/storage/chat_sync/`)
- Subscription model changes
- Device verification features
- Cloud-based data synchronization

### Lessons Learned

1. **Merge Conflicts:** When syncing upstream, carefully review each conflict to preserve intranet-specific modifications while accepting valuable upstream changes.
2. **TypeScript Errors:** Cloud service imports that are unused in intranet edition need to be removed to pass type checking.
3. **Electron Updates:** When Electron version changes, ffmpeg.dll hash must be updated in `scripts/verify-ffmpeg.js`.
4. **Documentation:** All three language README files (EN, ZH, JA) should be updated together for consistency.
