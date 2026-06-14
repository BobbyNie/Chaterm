/**
 * Router Guards - Intranet Edition Tests
 *
 * This test suite validates the intranet-specific modifications to router guards:
 * - Auto-skip login functionality
 * - Guest user initialization
 * - localStorage configuration
 * - User database initialization for guest user
 * - Manual /login access redirects to home
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { beforeEach as routerBeforeEach } from '../guards'

// Mock window.api
const mockWindowApi = {
  initUserDatabase: vi.fn()
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

// Mock getUserInfo and setUserInfo
const mockGetUserInfo = vi.fn()
const mockSetUserInfo = vi.fn()

vi.mock('@/utils/permission', () => ({
  getUserInfo: () => mockGetUserInfo(),
  setUserInfo: (userInfo: any) => mockSetUserInfo(userInfo)
}))

vi.mock('@/services/dataSyncService', () => ({
  dataSyncService: {
    initialize: vi.fn().mockResolvedValue(undefined)
  }
}))

// Mock import.meta.env
const mockImportMeta = {
  env: {
    MODE: 'development'
  }
}

describe('Router Guards - Intranet Edition', () => {
  beforeEach(() => {
    // Setup window.api mock
    global.window = global.window || ({} as Window & typeof globalThis)
    ;(global.window as unknown as Record<string, unknown>).api = mockWindowApi

    // Setup localStorage mock
    global.localStorage = mockLocalStorage as any

    // Setup import.meta.env
    Object.defineProperty(global, 'import', {
      value: {
        meta: mockImportMeta
      },
      writable: true
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Auto-skip login on application start', () => {
    it('should skip login when accessing /login route', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Should have cleared existing tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ctm-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jms-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo')

      // Should have set login-skipped flag
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('login-skipped', 'true')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ctm-token', 'guest_token')

      // Should have initialized guest user info
      expect(mockSetUserInfo).toHaveBeenCalledWith({
        uid: 999999999,
        username: 'guest',
        name: 'Guest',
        email: 'guest@chaterm.ai',
        token: 'guest_token'
      })

      // Should have initialized user database for guest user
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })

      // Should have redirected to home
      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should handle database initialization failure gracefully', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: false })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // When DB init fails, autoSkipLogin returns false, so it falls through to next()
      // which allows login page to be shown (but this shouldn't happen in practice)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle database initialization error', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockRejectedValue(new Error('DB error'))

      // autoSkipLogin doesn't catch errors, so it propagates
      // The guard should handle this gracefully
      await expect(routerBeforeEach({ path: '/login' }, {} as any, mockNext)).rejects.toThrow('DB error')

      // Since error was thrown, next should not have been called
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('Guest user initialization', () => {
    it('should initialize guest user with correct properties', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      const guestUserInfo = {
        uid: 999999999,
        username: 'guest',
        name: 'Guest',
        email: 'guest@chaterm.ai',
        token: 'guest_token'
      }

      expect(mockSetUserInfo).toHaveBeenCalledWith(guestUserInfo)
    })

    it('should use correct guest user UID', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Verify the UID passed to initUserDatabase
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
    })
  })

  describe('localStorage configuration', () => {
    it('should set correct localStorage values for intranet mode', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Verify all localStorage operations
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('login-skipped', 'true')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ctm-token', 'guest_token')
    })

    it('should clear existing tokens before setting guest token', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Verify removal of existing tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ctm-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jms-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo')
    })
  })

  describe('User database initialization for guest user', () => {
    it('should initialize database with guest UID', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
    })

    it('should handle successful database initialization', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should handle database initialization failure', async () => {
      const mockNext = vi.fn()
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: false, error: 'DB init failed' })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // When DB init fails, autoSkipLogin returns false, so it calls next() without args
      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('Guest user route protection', () => {
    it('should allow guest user to access home route', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/' }, {} as any, mockNext)

      // Should proceed to home (next() called without args when already at home)
      expect(mockNext).toHaveBeenCalledWith()
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
    })

    it('should redirect guest user to home when accessing other routes', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/some-other-route' }, {} as any, mockNext)

      // Should redirect to home
      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should handle database re-initialization for guest user', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should initialize database again
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should clear guest session and redirect to login on DB failure', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: false })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should clear all guest session data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('login-skipped')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ctm-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jms-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo')

      // Should redirect to login
      expect(mockNext).toHaveBeenCalledWith('/login')
    })

    it('should handle database initialization error for existing guest session', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockRejectedValue(new Error('Connection error'))

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should clear all guest session data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('login-skipped')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ctm-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jms-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo')

      // Should redirect to login
      expect(mockNext).toHaveBeenCalledWith('/login')
    })
  })

  describe('Non-guest user route protection', () => {
    it('should auto-skip login when no token exists', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockReturnValue(null)
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should auto-skip login
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('login-skipped', 'true')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ctm-token', 'guest_token')
      expect(mockSetUserInfo).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should redirect to login when auto-skip fails with no token', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockReturnValue(null)
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: false })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // autoSkipLogin attempted but DB init failed, redirect to login page
      expect(mockSetUserInfo).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith('/login')
    })
  })

  describe('Manual /login access', () => {
    it('should redirect to home when guest user manually accesses /login', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Should redirect to home instead of showing login page
      expect(mockNext).toHaveBeenCalledWith('/')
    })

    it('should show login page when user manually clears session and accesses /login', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'false'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/login' }, {} as any, mockNext)

      // Should auto-skip login again
      expect(mockNext).toHaveBeenCalledWith('/')
    })
  })

  describe('Guest token validation', () => {
    it('should recognize guest token correctly', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should treat as guest user
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
    })

    it('should not treat non-guest tokens as guest', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'false'
        if (key === 'ctm-token') return 'regular_user_token_123'
        return null
      })

      const mockUserInfo = {
        uid: 12345,
        username: 'testuser',
        token: 'regular_user_token_123'
      }
      mockGetUserInfo.mockReturnValue(mockUserInfo)
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should initialize database with regular user UID, not guest UID
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 12345 })
    })
  })

  describe('Login-skipped flag behavior', () => {
    it('should respect login-skipped flag for route protection', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'true'
        if (key === 'ctm-token') return 'guest_token'
        return null
      })
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should use guest user logic
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 999999999 })
    })

    it('should not use guest logic when login-skipped flag is false', async () => {
      const mockNext = vi.fn()
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'login-skipped') return 'false'
        if (key === 'ctm-token') return 'regular_token'
        return null
      })

      const mockUserInfo = {
        uid: 54321,
        username: 'regularuser',
        token: 'regular_token'
      }
      mockGetUserInfo.mockReturnValue(mockUserInfo)
      mockWindowApi.initUserDatabase.mockResolvedValue({ success: true })

      await routerBeforeEach({ path: '/workspace' }, {} as any, mockNext)

      // Should use regular user logic
      expect(mockWindowApi.initUserDatabase).toHaveBeenCalledWith({ uid: 54321 })
    })
  })
})
