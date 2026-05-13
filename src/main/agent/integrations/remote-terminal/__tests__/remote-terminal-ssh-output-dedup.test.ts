import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRequire, Module } from 'module'

const require = createRequire(import.meta.url)
const electronPath = require.resolve('electron')
const mockElectronModule = new Module(electronPath)
mockElectronModule.filename = electronPath
mockElectronModule.loaded = true
mockElectronModule.exports = {
  app: { getAppPath: () => process.cwd() },
  webContents: { getFocusedWebContents: vi.fn() }
}
require.cache[electronPath] = mockElectronModule

vi.mock('electron', () => ({
  app: { getAppPath: () => process.cwd() },
  webContents: { getFocusedWebContents: vi.fn() }
}))

const remoteSshExecStreamMock = vi.fn()

vi.mock('../../../../ssh/agentHandle', () => ({
  remoteSshConnect: vi.fn(),
  remoteSshExecStream: (...args: any[]) => remoteSshExecStreamMock(...args),
  remoteSshDisconnect: vi.fn(),
  handleRemoteExecInput: vi.fn().mockReturnValue({ success: true }),
  isWakeupSession: vi.fn().mockReturnValue(false),
  openWakeupShell: vi.fn(),
  findWakeupConnectionInfoByHost: vi.fn().mockReturnValue(null)
}))

vi.mock('../../../../ssh/capabilityRegistry', () => ({
  capabilityRegistry: { getBastion: vi.fn() },
  BastionErrorCode: {
    CAPABILITY_NOT_FOUND: 'BASTION_CAPABILITY_NOT_FOUND',
    AGENT_EXEC_UNAVAILABLE: 'BASTION_AGENT_EXEC_UNAVAILABLE'
  }
}))

vi.mock('../jumpserverHandle', () => ({
  handleJumpServerConnection: vi.fn(),
  jumpserverShellStreams: new Map(),
  jumpserverMarkedCommands: new Map()
}))

describe('RemoteTerminalProcess SSH output', () => {
  beforeEach(() => {
    remoteSshExecStreamMock.mockReset()
  })

  it('does not duplicate delayed prompt line when newline arrives', async () => {
    remoteSshExecStreamMock.mockImplementation(async (_sessionId: string, _command: string, onData: (chunk: string) => void) => {
      // Simulate output without newline first, then with newline
      onData('Password: ')
      onData('\nYou entered: adfaf\n')
      return { success: true }
    })

    const { RemoteTerminalProcess } = await import('../index')
    const process = new RemoteTerminalProcess()
    const lines: string[] = []

    process.on('line', (line) => lines.push(line))

    await process.run('session-1', 'bash -c "printf \'Password: \'"')

    // The test verifies that the delayed prompt line is not duplicated
    // when a newline arrives later
    expect(lines).toContain('Password: ')
    expect(lines).toContain('You entered: adfaf')
    // Ensure we don't have duplicate 'Password: ' entries
    const passwordCount = lines.filter((l) => l.includes('Password')).length
    expect(passwordCount).toBe(1)
  })
})
