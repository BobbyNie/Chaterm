/**
 * CI/CD Build Verification - Intranet Edition Tests
 *
 * This test suite validates the CI/CD pipeline configuration for the intranet edition:
 * - GitHub Actions workflow exists and is properly configured
 * - Workflow has Windows build job
 * - Workflow has macOS build job
 * - Versioning uses date format (yyyy.MM.dd)
 * - Build artifacts are correctly configured
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import path from 'path'
import fs from 'fs'

describe('CI/CD Build Verification - Intranet Edition', () => {
  const workflowPath = resolve('.github/workflows/build.yml')
  const projectRoot = resolve(process.cwd())
  let workflowContent: string

  beforeAll(() => {
    // Read the actual workflow file
    if (existsSync(workflowPath)) {
      workflowContent = readFileSync(workflowPath, 'utf-8')
    } else {
      throw new Error(`Workflow file not found at ${workflowPath}`)
    }
  })

  describe('GitHub Actions workflow file', () => {
    it('should have workflow file at correct path', () => {
      const exists = existsSync(workflowPath)
      expect(exists).toBe(true)
    })

    it('should have valid YAML structure', () => {
      expect(typeof workflowContent).toBe('string')
      expect(workflowContent).toContain('name:')
      expect(workflowContent).toContain('on:')
      expect(workflowContent).toContain('jobs:')
    })

    it('should have workflow name', () => {
      expect(workflowContent).toContain('name: Build')
    })
  })

  describe('Workflow triggers', () => {
    it('should trigger on push to main and intranet branches', () => {
      expect(workflowContent).toMatch(/branches:\s*\[main,\s*intranet\]/)
    })

    it('should trigger on pull requests to main branch', () => {
      expect(workflowContent).toContain('pull_request:')
      expect(workflowContent).toMatch(/branches:\s*\[main\]/)
    })

    it('should support manual workflow dispatch', () => {
      expect(workflowContent).toContain('workflow_dispatch:')
    })

    it('should have edition input for manual dispatch', () => {
      expect(workflowContent).toMatch(/edition:\s*description:/)
      expect(workflowContent).toMatch(/-\s*cn/)
      expect(workflowContent).toMatch(/-\s*global/)
    })
  })

  describe('Windows build job', () => {
    it('should have Windows build job defined', () => {
      expect(workflowContent).toContain('build-windows:')
    })

    it('should use Windows latest runner', () => {
      expect(workflowContent).toMatch(/build-windows:([\s\S]*?)runs-on:\s*windows-latest/)
    })

    it('should have Node.js setup step', () => {
      expect(workflowContent).toContain('actions/setup-node@v6')
      expect(workflowContent).toMatch(/node-version:\s*22\.x/)
    })

    it('should have version setting step using date format', () => {
      expect(workflowContent).toContain('Set version to current date')
      expect(workflowContent).toMatch(/\$date = Get-Date -Format "yyyy\.MM\.dd"/)
    })

    it('should have build steps for both CN and Global editions', () => {
      expect(workflowContent).toContain('npm run build:win:cn')
      expect(workflowContent).toContain('npm run build:win:global')
    })

    it('should have artifact upload step', () => {
      expect(workflowContent).toContain('actions/upload-artifact@v7')
      expect(workflowContent).toContain('windows-build')
    })

    it('should configure Node.js memory options', () => {
      expect(workflowContent).toMatch(/NODE_OPTIONS:\s*"--max-old-space-size=6144"/)
    })
  })

  describe('macOS build job', () => {
    it('should have macOS build job defined', () => {
      expect(workflowContent).toContain('build-mac-arm64:')
    })

    it('should use macOS 14 runner', () => {
      expect(workflowContent).toMatch(/build-mac-arm64:([\s\S]*?)runs-on:\s*macos-14/)
    })

    it('should have Node.js setup step', () => {
      expect(workflowContent).toMatch(/node-version:\s*22\.x/)
    })

    it('should have version setting step using date format', () => {
      expect(workflowContent).toContain('Set version to current date')
      expect(workflowContent).toContain('date=$(date +%Y.%m.%d)')
    })

    it('should have build steps for both CN and Global editions', () => {
      expect(workflowContent).toContain('npm run build:mac:cn')
      expect(workflowContent).toContain('npm run build:mac:global')
    })

    it('should have artifact upload step', () => {
      expect(workflowContent).toContain('actions/upload-artifact@v7')
      expect(workflowContent).toContain('macos-arm64-build')
    })

    it('should clear electron-builder cache', () => {
      expect(workflowContent).toContain('Clear electron-builder cache')
      expect(workflowContent).toMatch(/rm -rf ~\/Library\/Caches\/electron-builder/)
    })

    it('should configure code signing for macOS', () => {
      expect(workflowContent).toMatch(/CSC_IDENTITY_AUTO_DISCOVERY:\s*"true"/)
    })

    it('should configure Node.js memory options', () => {
      expect(workflowContent).toMatch(/NODE_OPTIONS:\s*"--max-old-space-size=6144"/)
    })
  })

  describe('Release creation job', () => {
    it('should have release creation job', () => {
      expect(workflowContent).toContain('create-release:')
    })

    it('should depend on build jobs', () => {
      expect(workflowContent).toMatch(/needs:\s*\[build-windows,\s*build-mac-arm64\]/)
    })

    it('should only run on push or workflow_dispatch', () => {
      expect(workflowContent).toMatch(/if:\s*github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/)
    })

    it('should download Windows artifacts', () => {
      expect(workflowContent).toContain('actions/download-artifact@v4')
      expect(workflowContent).toContain('name: windows-build')
    })

    it('should download macOS artifacts', () => {
      expect(workflowContent).toContain('name: macos-arm64-build')
    })

    it('should create GitHub release', () => {
      expect(workflowContent).toContain('softprops/action-gh-release@v2')
    })

    it('should use date format for release tag', () => {
      expect(workflowContent).toMatch(/tag_name:\s*v\${{ env\.BUILD_VERSION }}/)
    })
  })

  describe('Versioning configuration', () => {
    it('should use date format for version (PowerShell on Windows)', () => {
      expect(workflowContent).toMatch(/\$date = Get-Date -Format "yyyy\.MM\.dd"/)
      expect(workflowContent).toMatch(/npm version \$date --no-git-tag-version/)
    })

    it('should use date format for version (Bash on macOS/Linux)', () => {
      expect(workflowContent).toContain('date=$(date +%Y.%m.%d)')
      expect(workflowContent).toMatch(/npm version \$date --no-git-tag-version/)
    })

    it('should set BUILD_VERSION environment variable', () => {
      expect(workflowContent).toMatch(/echo "BUILD_VERSION=\$date" >> \$env:GITHUB_ENV/)
      expect(workflowContent).toMatch(/echo "BUILD_VERSION=\$date" >> \$GITHUB_ENV/)
    })

    it('should add release notes for date version', () => {
      expect(workflowContent).toContain('Add release notes for date version')
      expect(workflowContent).toContain('node scripts/fix-update-notes.js')
    })
  })

  describe('Build artifacts configuration', () => {
    it('should include Windows installer in release', () => {
      expect(workflowContent).toMatch(/files:\s*\|/)
      expect(workflowContent).toMatch(/dist\/windows\/cn\/\*\.exe/)
    })

    it('should include macOS archive in release', () => {
      expect(workflowContent).toMatch(/dist\/macos\/cn\/\*\.zip/)
    })

    it('should configure artifact retention', () => {
      expect(workflowContent).toMatch(/retention-days:\s*7/)
    })

    it('should create non-draft release', () => {
      expect(workflowContent).toMatch(/draft:\s*false/)
    })

    it('should create non-prerelease release', () => {
      expect(workflowContent).toMatch(/prerelease:\s*false/)
    })
  })

  describe('Build steps validation', () => {
    it('should run package-lock.json patch script', () => {
      expect(workflowContent).toContain('Fix package-lock.json')
      expect(workflowContent).toContain('node scripts/patch-package-lock.js')
    })

    it('should install dependencies using npm ci', () => {
      expect(workflowContent).toContain('npm ci --prefer-offline')
    })

    it('should use conditional build steps for editions', () => {
      expect(workflowContent).toMatch(/if:\s*github\.event\.inputs\.edition == 'cn'/)
      expect(workflowContent).toMatch(/if:\s*github\.event\.inputs\.edition == 'global'/)
    })
  })

  describe('Workflow permissions', () => {
    it('should have write permissions for contents', () => {
      expect(workflowContent).toContain('permissions:')
      expect(workflowContent).toMatch(/contents:\s*write/)
    })
  })

  describe('Edition-specific builds', () => {
    it('should support CN edition builds', () => {
      expect(workflowContent).toContain('build:win:cn')
      expect(workflowContent).toContain('build:mac:cn')
    })

    it('should support Global edition builds', () => {
      expect(workflowContent).toContain('build:win:global')
      expect(workflowContent).toContain('build:mac:global')
    })

    it('should default to CN edition when not specified', () => {
      expect(workflowContent).toMatch(/if:\s*github\.event\.inputs\.edition == 'cn' \|\| github\.event\.inputs\.edition == ''/)
    })
  })

  describe('Release notes configuration', () => {
    it('should add release notes for automated builds', () => {
      expect(workflowContent).toContain('Add release notes for date version')
      expect(workflowContent).toContain('node scripts/fix-update-notes.js')
    })

    it('should update update-notes.json file', () => {
      // Verify the external script exists and contains the necessary logic
      const scriptPath = path.join(projectRoot, 'scripts/fix-update-notes.js')
      expect(fs.existsSync(scriptPath)).toBe(true)

      const scriptContent = fs.readFileSync(scriptPath, 'utf-8')
      expect(scriptContent).toContain("notesPath = 'resources/update-notes.json'")
      expect(scriptContent).toContain('notes.versions.unshift')
      expect(scriptContent).toContain('highlights:')
      expect(scriptContent).toContain('CI Build - CI 自动构建版本')
      expect(scriptContent).toContain('CI Build - Automated CI build')
      expect(scriptContent).toMatch(/fs\.writeFileSync\(notesPath/)
    })
  })

  describe('Intranet branch support', () => {
    it('should trigger on intranet branch push', () => {
      expect(workflowContent).toMatch(/branches:\s*\[main,\s*intranet\]/)
    })

    it('should support both editions in builds', () => {
      expect(workflowContent).toContain('build:win:cn')
      expect(workflowContent).toContain('build:win:global')
      expect(workflowContent).toContain('build:mac:cn')
      expect(workflowContent).toContain('build:mac:global')
    })
  })

  describe('Workflow structure validation', () => {
    it('should have all required jobs', () => {
      expect(workflowContent).toContain('build-windows:')
      expect(workflowContent).toContain('build-mac-arm64:')
      expect(workflowContent).toContain('create-release:')
    })

    it('should have proper job dependencies', () => {
      expect(workflowContent).toMatch(/needs:\s*\[build-windows,\s*build-mac-arm64\]/)
    })

    it('should use GitHub Actions syntax correctly', () => {
      expect(workflowContent).toContain('actions/checkout@v6')
      expect(workflowContent).toContain('actions/setup-node@v6')
      expect(workflowContent).toContain('actions/upload-artifact@v7')
      expect(workflowContent).toContain('actions/download-artifact@v4')
      expect(workflowContent).toContain('softprops/action-gh-release@v2')
    })
  })

  describe('Build environment configuration', () => {
    it('should set Node.js version to 22.x', () => {
      expect(workflowContent).toMatch(/node-version:\s*22\.x/g)
    })

    it('should configure adequate memory for Node.js', () => {
      expect(workflowContent).toMatch(/NODE_OPTIONS:\s*"--max-old-space-size=6144"/g)
    })

    it('should use offline npm installation', () => {
      expect(workflowContent).toContain('npm ci --prefer-offline')
    })
  })

  describe('Artifact paths validation', () => {
    it('should use correct Windows artifact paths', () => {
      expect(workflowContent).toMatch(/path:\s*dist\//)
      expect(workflowContent).toMatch(/windows-build/)
    })

    it('should use correct macOS artifact paths', () => {
      expect(workflowContent).toMatch(/macos-arm64-build/)
    })

    it('should upload artifacts to correct locations', () => {
      expect(workflowContent).toContain('Upload Windows artifacts')
      expect(workflowContent).toContain('Upload macOS artifacts')
    })
  })
})
