import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { connectAssetInfoLogic } from '../chaterm/assets.organization'

describe('connectAssetInfoLogic with fallback', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')

    db.exec(`
      CREATE TABLE t_assets (
        uuid TEXT PRIMARY KEY,
        asset_ip TEXT,
        asset_type TEXT,
        auth_type TEXT,
        port INTEGER,
        username TEXT,
        password TEXT,
        key_chain_id INTEGER,
        need_proxy INTEGER,
        proxy_name TEXT,
        jump_host_uuid TEXT
      );

      CREATE TABLE t_organization_assets (
        uuid TEXT PRIMARY KEY,
        organization_uuid TEXT,
        host TEXT,
        hostname TEXT,
        bastion_comment TEXT,
        jump_server_type TEXT,
        FOREIGN KEY (organization_uuid) REFERENCES t_assets(uuid)
      );
    `)

    db.exec(`
      INSERT INTO t_assets (uuid, asset_ip, asset_type, auth_type, port, username)
      VALUES ('org-uuid-1', '10.0.0.1', 'organization', 'password', 22, 'admin');

      INSERT INTO t_organization_assets (uuid, organization_uuid, host, hostname, jump_server_type)
      VALUES ('child-uuid-1', 'org-uuid-1', '192.168.1.100', 'server01', 'tencent');
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('should find asset by UUID when UUID is valid', () => {
    const result = connectAssetInfoLogic(db, 'org-uuid-1')
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('org-uuid-1')
    expect(result.asset_ip).toBe('10.0.0.1')
  })

  it('should find organization asset by UUID', () => {
    const result = connectAssetInfoLogic(db, 'child-uuid-1')
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('child-uuid-1')
    expect(result.host).toBe('192.168.1.100')
    expect(result.jump_server_type).toBe('tencent')
  })

  it('should return null when UUID does not exist', () => {
    const result = connectAssetInfoLogic(db, 'non-existent-uuid')
    expect(result).toBeNull()
  })

  it('should use fallback to find asset by organizationUuid and host when UUID is stale', () => {
    const result = connectAssetInfoLogic(db, 'stale-uuid', {
      organizationUuid: 'org-uuid-1',
      ip: '192.168.1.100'
    })
    expect(result).toBeTruthy()
    expect(result.uuid).toBe('child-uuid-1')
    expect(result.host).toBe('192.168.1.100')
  })

  it('should return null when fallback does not find a match', () => {
    const result = connectAssetInfoLogic(db, 'stale-uuid', {
      organizationUuid: 'org-uuid-1',
      ip: '10.99.99.99'
    })
    expect(result).toBeNull()
  })
})
