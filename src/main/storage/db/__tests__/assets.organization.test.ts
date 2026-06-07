import { describe, expect, it, vi } from 'vitest'

vi.mock('better-sqlite3', () => ({
  default: class {}
}))

type Statement<T = unknown> = {
  get: (...args: unknown[]) => T
  run: (...args: unknown[]) => { changes: number }
  all: (...args: unknown[]) => T[]
}

const orgAsset = {
  uuid: 'org-uuid-1',
  asset_ip: '10.0.0.1',
  asset_type: 'organization',
  auth_type: 'password',
  port: 22,
  username: 'admin',
  password: '',
  key_chain_id: null,
  need_proxy: 0,
  proxy_name: '',
  jump_host_uuid: null
}

const childAsset = {
  hostname: 'server01',
  host: '192.168.1.100',
  comment: '',
  asset_ip: '10.0.0.1',
  organization_uuid: 'org-uuid-1',
  uuid: 'child-uuid-1',
  jump_server_type: 'tencent',
  asset_type: 'organization',
  auth_type: 'password',
  port: 22,
  username: 'admin',
  password: '',
  key_chain_id: null,
  need_proxy: 0,
  proxy_name: ''
}

function createMockDb(handlers: {
  assetByUuid?: Record<string, unknown | null>
  orgAssetByUuid?: Record<string, unknown | null>
  orgAssetByOrgAndHost?: Record<string, unknown | null>
}) {
  return {
    prepare(sql: string): Statement {
      if (sql.includes('FROM t_assets') && sql.includes('WHERE uuid = ?')) {
        return {
          get: (uuid: unknown) => handlers.assetByUuid?.[String(uuid)] ?? null,
          run: () => ({ changes: 0 }),
          all: () => []
        }
      }

      if (sql.includes('FROM t_organization_assets') && sql.includes('WHERE oa.uuid = ?')) {
        return {
          get: (uuid: unknown) => handlers.orgAssetByUuid?.[String(uuid)] ?? null,
          run: () => ({ changes: 0 }),
          all: () => []
        }
      }

      if (sql.includes('WHERE oa.organization_uuid = ? AND oa.host = ?')) {
        return {
          get: (organizationUuid: unknown, host: unknown) => handlers.orgAssetByOrgAndHost?.[`${organizationUuid}:${host}`] ?? null,
          run: () => ({ changes: 0 }),
          all: () => []
        }
      }

      throw new Error(`Unexpected SQL: ${sql}`)
    }
  }
}

describe('connectAssetInfoLogic with fallback', () => {
  it('should find asset by UUID when UUID is valid', async () => {
    const { connectAssetInfoLogic } = await import('../chaterm/assets.organization')
    const db = createMockDb({
      assetByUuid: { 'org-uuid-1': { ...orgAsset } }
    })

    const result = connectAssetInfoLogic(db as any, 'org-uuid-1')
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('org-uuid-1')
    expect(result.asset_ip).toBe('10.0.0.1')
  })

  it('should find organization asset by UUID', async () => {
    const { connectAssetInfoLogic } = await import('../chaterm/assets.organization')
    const db = createMockDb({
      assetByUuid: { 'child-uuid-1': null },
      orgAssetByUuid: { 'child-uuid-1': { ...childAsset } }
    })

    const result = connectAssetInfoLogic(db as any, 'child-uuid-1')
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('child-uuid-1')
    expect(result.host).toBe('192.168.1.100')
    expect(result.jump_server_type).toBe('tencent')
  })

  it('should return null when UUID does not exist', async () => {
    const { connectAssetInfoLogic } = await import('../chaterm/assets.organization')
    const db = createMockDb({
      assetByUuid: { 'non-existent-uuid': null },
      orgAssetByUuid: { 'non-existent-uuid': null }
    })

    const result = connectAssetInfoLogic(db as any, 'non-existent-uuid')
    expect(result).toBeNull()
  })

  it('should use fallback to find asset by organizationUuid and host when UUID is stale', async () => {
    const { connectAssetInfoLogic } = await import('../chaterm/assets.organization')
    const db = createMockDb({
      assetByUuid: { 'stale-uuid': null },
      orgAssetByUuid: { 'stale-uuid': null },
      orgAssetByOrgAndHost: { 'org-uuid-1:192.168.1.100': { ...childAsset } }
    })

    const result = connectAssetInfoLogic(db as any, 'stale-uuid', {
      organizationUuid: 'org-uuid-1',
      ip: '192.168.1.100'
    })
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('child-uuid-1')
    expect(result.host).toBe('192.168.1.100')
  })

  it('should return null when fallback does not find a match', async () => {
    const { connectAssetInfoLogic } = await import('../chaterm/assets.organization')
    const db = createMockDb({
      assetByUuid: { 'stale-uuid': null },
      orgAssetByUuid: { 'stale-uuid': null },
      orgAssetByOrgAndHost: { 'org-uuid-1:10.99.99.99': null }
    })

    const result = connectAssetInfoLogic(db as any, 'stale-uuid', {
      organizationUuid: 'org-uuid-1',
      ip: '10.99.99.99'
    })
    expect(result).toBeNull()
  })
})
