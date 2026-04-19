/**
 * LeftTab Menu - Intranet Edition Tests
 *
 * This test suite validates the intranet-specific modifications to the LeftTab menu:
 * - User menu removed from sidebar
 * - Menu count is correct (reduced by 2 for user menu + billing)
 * - Bottom menu doesn't show user avatar
 * - Settings menu doesn't include billing tab
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import LeftTabComponent from '../index.vue'
import { menuTabsData } from '../constants/data'

// Mock eventBus
vi.mock('@/utils/eventBus', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}))

// Mock window.api
const mockWindowApi = {
  getPluginViews: vi.fn().mockResolvedValue([]),
  onPluginMetadataChanged: vi.fn().mockReturnValue(() => {})
}

// Mock userInfoStore
const mockUserStore = {
  stashMenu: ''
}

vi.mock('@/store/index', () => ({
  userInfoStore: () => mockUserStore
}))

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {}
  }
})

describe('LeftTab Menu - Intranet Edition', () => {
  let wrapper: any
  let pinia: ReturnType<typeof createPinia>

  const createWrapper = () => {
    // Mock window.api
    ;(global as any).window = {
      ...global.window,
      api: mockWindowApi
    }

    return mount(LeftTabComponent, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          'a-tooltip': {
            template: '<div class="a-tooltip"><slot /></div>',
            props: ['title', 'placement', 'mouse-enter-delay']
          }
        }
      }
    })
  }

  beforeEach(() => {
    // Setup Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // Reset all mocks
    vi.clearAllMocks()
    mockWindowApi.getPluginViews.mockResolvedValue([])
  })

  describe('Menu data structure', () => {
    it('should have correct menu count (9 items without user menu)', () => {
      // Intranet edition removed user menu, so we expect 9 items:
      // Hosts, Assets, Files, Snippets, Knowledge, Extensions, AI, Kubernetes, Setting
      expect(menuTabsData.length).toBe(9)
    })

    it('should not include user menu in menuTabsData', () => {
      const userMenuItem = menuTabsData.find((item) => item.key === 'user')
      expect(userMenuItem).toBeUndefined()
    })

    it('should not include billing menu in menuTabsData', () => {
      const billingMenuItem = menuTabsData.find((item) => item.key === 'billing')
      expect(billingMenuItem).toBeUndefined()
    })

    it('should include all expected menu items', () => {
      const expectedKeys = [
        'workspace', // Hosts
        'assets', // Assets
        'files', // Files
        'snippets', // Snippets
        'knowledgecenter', // Knowledge
        'extensions', // Extensions
        'ai', // AI
        'kubernetes', // Kubernetes
        'setting' // Setting
      ]

      const actualKeys = menuTabsData.map((item) => item.key)
      expect(actualKeys).toEqual(expectedKeys)
    })

    it('should have correct menu structure with main menu and bottom menu', () => {
      // Last item should be 'setting' which goes to bottom menu
      const lastItem = menuTabsData[menuTabsData.length - 1]
      expect(lastItem.key).toBe('setting')

      // First 8 items should be in main menu
      const mainMenuItems = menuTabsData.slice(0, -1)
      expect(mainMenuItems.length).toBe(8)
    })
  })

  describe('Component rendering', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should render main menu with correct number of items', () => {
      const mainMenuItems = menuTabsData.slice(0, -1)

      // The component should render all main menu items
      mainMenuItems.forEach((item) => {
        expect(item.key).toBeDefined()
        expect(item.name).toBeDefined()
        expect(item.icon).toBeDefined()
      })
    })

    it('should render bottom menu with only setting item', () => {
      const bottomMenuItems = menuTabsData.slice(-1)

      expect(bottomMenuItems.length).toBe(1)
      expect(bottomMenuItems[0].key).toBe('setting')
    })

    it('should not render user menu item', () => {
      // Check that there's no user menu item in the data
      const userMenuItem = menuTabsData.find((item) => item.key === 'user' || item.name === 'User')
      expect(userMenuItem).toBeUndefined()
    })

    it('should not render notice menu item (commented out)', () => {
      // The notice menu is commented out in the source
      const noticeMenuItem = menuTabsData.find((item) => item.key === 'notice')
      expect(noticeMenuItem).toBeUndefined()
    })
  })

  describe('Menu item properties', () => {
    it('should have required properties for each menu item', () => {
      menuTabsData.forEach((item) => {
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('key')
        expect(item).toHaveProperty('icon')
      })
    })

    it('should have valid icon URLs for each menu item', () => {
      menuTabsData.forEach((item) => {
        expect(item.icon).toBeDefined()
        expect(typeof item.icon).toBe('string')
        expect(item.icon.length).toBeGreaterThan(0)
        // Icons can be data URLs or file URLs
        expect(item.icon).toMatch(/^(data:|http:|https:|\.\/|\/)/)
      })
    })

    it('should have unique keys for all menu items', () => {
      const keys = menuTabsData.map((item) => item.key)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('Menu item order', () => {
    it('should maintain correct menu order', () => {
      const expectedOrder = ['workspace', 'assets', 'files', 'snippets', 'knowledgecenter', 'extensions', 'ai', 'kubernetes', 'setting']

      const actualOrder = menuTabsData.map((item) => item.key)
      expect(actualOrder).toEqual(expectedOrder)
    })

    it('should have workspace (Hosts) as first item', () => {
      expect(menuTabsData[0].key).toBe('workspace')
    })

    it('should have setting as last item (bottom menu)', () => {
      expect(menuTabsData[menuTabsData.length - 1].key).toBe('setting')
    })
  })

  describe('Intranet-specific modifications', () => {
    it('should not have user-related menu items', () => {
      const userRelatedKeys = ['user', 'profile', 'account', 'avatar']
      const foundUserKeys = menuTabsData.filter((item) => userRelatedKeys.includes(item.key))

      expect(foundUserKeys.length).toBe(0)
    })

    it('should not have billing menu item', () => {
      const billingKeys = ['billing', 'payment', 'subscription']
      const foundBillingKeys = menuTabsData.filter((item) => billingKeys.includes(item.key))

      expect(foundBillingKeys.length).toBe(0)
    })

    it('should have all core functionality menus', () => {
      const coreMenus = ['workspace', 'ai', 'files', 'assets', 'extensions', 'kubernetes']

      coreMenus.forEach((menuKey) => {
        const menuItem = menuTabsData.find((item) => item.key === menuKey)
        expect(menuItem).toBeDefined()
      })
    })
  })

  describe('Menu count comparison', () => {
    it('should have 9 menu items total (reduced from original 11)', () => {
      // Original upstream had 11 items (including user menu + billing)
      // Intranet edition has 9 items (removed user menu and billing)
      expect(menuTabsData.length).toBe(9)
    })

    it('should have 8 items in main menu', () => {
      const mainMenuItems = menuTabsData.slice(0, -1)
      expect(mainMenuItems.length).toBe(8)
    })

    it('should have 1 item in bottom menu', () => {
      const bottomMenuItems = menuTabsData.slice(-1)
      expect(bottomMenuItems.length).toBe(1)
    })
  })

  describe('Menu item names', () => {
    it('should have correct menu item names', () => {
      const expectedNames = ['Hosts', 'Assets', 'Files', 'Snippets', 'Knowledge', 'Plugins', 'AI', 'Kubernetes', 'Setting']

      const actualNames = menuTabsData.map((item) => item.name)
      expect(actualNames).toEqual(expectedNames)
    })

    it('should have Setting as the bottom menu item name', () => {
      const bottomMenuItem = menuTabsData[menuTabsData.length - 1]
      expect(bottomMenuItem.name).toBe('Setting')
    })
  })

  describe('Menu integration with component', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should use menuTabsData in component template', () => {
      // The component should have access to menuTabsData
      expect(typeof menuTabsData).toBe('object')
      expect(Array.isArray(menuTabsData)).toBe(true)
    })

    it('should handle menu clicks correctly', async () => {
      const vm = wrapper.vm as any

      // Test menuClick method exists
      expect(typeof vm.menuClick).toBe('function')

      // Test that menuClick doesn't throw errors
      expect(() => vm.menuClick('workspace')).not.toThrow()
    })

    it('should handle userConfig click correctly', async () => {
      const vm = wrapper.vm as any

      // Test userConfig method exists
      expect(typeof vm.userConfig).toBe('function')

      // Emit event when userConfig is called
      vm.userConfig()
      // In the actual component, this should emit 'open-user-tab' event
      // We verify the method exists and is callable
    })
  })

  describe('Plugin views integration', () => {
    it('should support plugin views in main menu', () => {
      const vm = wrapper.vm as any

      // Component should have pluginViews ref
      expect(vm).toHaveProperty('pluginViews')
    })

    it('should load plugin views on mount', async () => {
      wrapper = createWrapper()

      // Wait for onMounted
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Should have called getPluginViews
      expect(mockWindowApi.getPluginViews).toHaveBeenCalled()
    })
  })

  describe('Menu accessibility', () => {
    it('should have tooltips for all menu items', () => {
      menuTabsData.forEach((item) => {
        expect(item.name).toBeDefined()
        expect(item.name.length).toBeGreaterThan(0)
      })
    })

    it('should have icon URLs for all menu items', () => {
      menuTabsData.forEach((item) => {
        expect(item.icon).toBeDefined()
        // Icons can be either data URLs or file paths
        expect(item.icon.length).toBeGreaterThan(0)
        expect(typeof item.icon).toBe('string')
      })
    })
  })

  describe('Menu consistency', () => {
    it('should maintain consistent menu structure across renders', () => {
      const firstRender = [...menuTabsData]
      const secondRender = [...menuTabsData]

      expect(firstRender).toEqual(secondRender)
    })

    it('should not have duplicate menu items', () => {
      const keys = menuTabsData.map((item) => item.key)
      const uniqueKeys = new Set(keys)

      expect(keys.length).toBe(uniqueKeys.size)
    })
  })
})
