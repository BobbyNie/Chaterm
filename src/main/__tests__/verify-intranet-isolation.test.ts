/**
 * Runtime External Network Isolation - Intranet Edition Tests
 *
 * This suite asserts that the intranet (cn) edition never reaches out to
 * external cloud services at runtime. It complements verify-intranet-build.test.ts
 * (which covers CI/CD configuration) by guarding the runtime network surface:
 *
 *  - Edition config and env files contain no external cloud URLs
 *  - Cloud features (data-sync / telemetry / kb-search) are hard-disabled at startup
 *  - PostHog is not instantiated for the cn edition
 *  - The auto-updater is gated to the global edition
 *  - External-endpoint provider UIs (DeepSeek / voice / check-update) are hidden
 *
 * Run via `npm run test:main`. Mirrors the checks in scripts/post-sync-verify.sh
 * (verify_external_isolation) so the same guarantees are enforced in CI tests too.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const projectRoot = resolve(process.cwd())

const readFile = (relPath: string): string => {
  const abs = resolve(projectRoot, relPath)
  if (!existsSync(abs)) {
    throw new Error(`File not found: ${relPath}`)
  }
  return readFileSync(abs, 'utf-8')
}

describe('Runtime External Network Isolation - Intranet Edition', () => {
  describe('Edition config has no external cloud URLs', () => {
    let cnConfig: string
    beforeAll(() => {
      cnConfig = readFile('build/edition-config/cn.json')
    })

    const externalDomains = ['chaterm.net', 'chaterm.cn', 'deepseek.com', 'i.posthog.com', 'intsig.net']

    externalDomains.forEach((domain) => {
      it(`cn.json should not reference ${domain}`, () => {
        expect(cnConfig).not.toContain(domain)
      })
    })

    it('cn.json api/sync/kms/speech/docs URLs should be empty', () => {
      const cfg = JSON.parse(cnConfig)
      expect(cfg.api.baseUrl).toBe('')
      expect(cfg.api.kmsUrl).toBe('')
      expect(cfg.api.syncUrl).toBe('')
      expect(cfg.speech.wsUrl).toBe('')
      expect(cfg.docs.baseUrl).toBe('')
    })
  })

  describe('Env files have no external cloud endpoints', () => {
    const envFiles = ['build/.env.production.cn', 'build/.env.development.cn']

    envFiles.forEach((file) => {
      const content = readFile(file)
      ;['chaterm.net', 'chaterm.cn', 'deepseek.com', 'i.posthog.com'].forEach((domain) => {
        it(`${file} should not reference ${domain}`, () => {
          expect(content).not.toContain(domain)
        })
      })
    })
  })

  describe('electron-builder has no external publish URL', () => {
    it('electron-builder.yml should not publish to intsig.net', () => {
      expect(readFile('electron-builder.yml')).not.toContain('chaterm-static.intsig.net')
    })

    it('electron-builder.cn.yml should not publish to static-download8.chaterm.net', () => {
      expect(readFile('electron-builder.cn.yml')).not.toContain('static-download8.chaterm.net')
    })
  })

  describe('Cloud features are hard-disabled in the main process', () => {
    let indexTs: string
    beforeAll(() => {
      indexTs = readFile('src/main/index.ts')
    })

    it('data sync is hard-disabled for the intranet edition', () => {
      expect(indexTs).toContain("CHATERM_DATA_SYNC_ENABLED = 'false'")
    })

    it('telemetry is hard-disabled for the intranet edition', () => {
      expect(indexTs).toContain("CHATERM_TELEMETRY_ENABLED = 'false'")
    })

    it('kb search is hard-disabled for the intranet edition', () => {
      expect(indexTs).toContain("CHATERM_KB_SEARCH_ENABLED = 'false'")
    })

    it('auto-updater is gated to the global edition', () => {
      expect(indexTs).toContain('never register the auto-updater')
    })

    it('chat-sync short-circuits for the intranet edition', () => {
      expect(indexTs).toContain('chat sync needs an external sync server')
    })
  })

  describe('PostHog is not instantiated in the intranet edition', () => {
    it('client field is nullable', () => {
      const content = readFile('src/main/agent/services/telemetry/TelemetryService.ts')
      expect(content).toContain('private client: PostHog | null = null')
    })

    it('constructor only instantiates PostHog for the global edition', () => {
      const content = readFile('src/main/agent/services/telemetry/TelemetryService.ts')
      expect(content).toMatch(/if \(isGlobalEdition\(\)\)\s*\{[\s\S]*new PostHog/)
    })
  })

  describe('External-endpoint provider UIs are hidden in the intranet edition', () => {
    it('DeepSeek config card is gated by isGlobalEdition', () => {
      const content = readFile('src/renderer/src/views/components/LeftTab/setting/model.vue')
      expect(content).toMatch(/v-if="isGlobalEdition\(\)"/)
    })

    it('Check-for-update button is gated by isGlobalEdition', () => {
      const content = readFile('src/renderer/src/views/components/LeftTab/setting/about.vue')
      expect(content).toMatch(/v-(if|show)="isGlobalEdition\(\)"/)
    })

    it('Realtime voice input is gated by isGlobalEdition', () => {
      const content = readFile('src/renderer/src/views/components/AiTab/components/voice/voiceInputRealTime.vue')
      expect(content).toMatch(/v-if="isGlobalEdition\(\)"/)
    })
  })
})
