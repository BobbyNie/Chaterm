//  Copyright (c) 2025-present, chaterm.ai  All rights reserved.
//  This source code is licensed under the GPL-3.0

import { describe, it, expect } from 'vitest'
import { createProxyAgent } from '../user-proxy'
import type { ProxyConfig } from '@shared/Proxy'

describe('user-proxy - Proxy Credential URL Encoding', () => {
  it('should encode username with @ symbol', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user@example.com',
      password: 'password'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%40example.com')
  })

  it('should encode password with colon', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user',
      password: 'pass:word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('pass%3Aword')
  })

  it('should encode password with slash', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user',
      password: 'pass/word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('pass%2Fword')
  })

  it('should encode credentials with hash symbol', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user#name',
      password: 'pass#word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%23name')
    expect(agent?.proxy).toContain('pass%23word')
  })

  it('should encode credentials with question mark', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user?name',
      password: 'pass?word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%3Fname')
    expect(agent?.proxy).toContain('pass%3Fword')
  })

  it('should encode credentials with ampersand', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user&name',
      password: 'pass&word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%26name')
    expect(agent?.proxy).toContain('pass%26word')
  })

  it('should encode credentials with equals sign', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user=name',
      password: 'pass=word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%3Dname')
    expect(agent?.proxy).toContain('pass%3Dword')
  })

  it('should handle Unicode characters in credentials', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user名前',
      password: 'password'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toContain('user%E5%90%8D%E5%89%8D')
  })

  it('should handle empty credentials gracefully', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: false,
      username: '',
      password: ''
    }
    const agent = createProxyAgent(config)
    expect(agent).toBeDefined()
  })

  it('should handle undefined config', () => {
    const agent = createProxyAgent(undefined)
    expect(agent).toBeUndefined()
  })

  it('should not include credentials when proxy identity is disabled', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: false,
      username: 'user@example.com',
      password: 'pass:word'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toBe('http://proxy.example.com:8080')
  })

  it('should preserve URL structure when encoding credentials', () => {
    const config: ProxyConfig = {
      type: 'HTTP',
      host: 'proxy.example.com',
      port: 8080,
      enableProxyIdentity: true,
      username: 'user',
      password: 'pass'
    }
    const agent = createProxyAgent(config) as any
    expect(agent?.proxy).toMatch(/^http:\/\/user:pass@proxy\.example\.com:8080$/)
  })
})
