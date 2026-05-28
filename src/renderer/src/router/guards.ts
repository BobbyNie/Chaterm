import axios from 'axios'
import config from '@/config'
import { getUserInfo, removeToken, setUserInfo } from '@/utils/permission'
import { dataSyncService } from '@/services/dataSyncService'

const logger = createRendererLogger('router')
let aiModelWarmupScheduled = false

// Dedicated axios instance for startup token verification (no global 401 redirect interceptors)
const authCheckRequest = axios.create({ baseURL: config.api, timeout: 5000 })
authCheckRequest.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ctm-token')
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`
  return cfg
})

function scheduleAiModelWarmup(): void {
  if (aiModelWarmupScheduled) {
    return
  }
  aiModelWarmupScheduled = true

  const runWarmup = () => {
    void import('@/views/components/AiTab/composables/useModelConfiguration')
      .then(({ useModelConfiguration }) => {
        void useModelConfiguration()
          .initModelOptions()
          .catch((error) => {
            logger.warn('Failed to warm up AI model options', { error })
          })
      })
      .catch((error) => {
        logger.warn('Failed to load AI model configuration warmup', { error })
      })
  }

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  }

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(runWarmup, { timeout: 5_000 })
    return
  }

  window.setTimeout(runWarmup, 1_500)
}

async function verifyTokenWithServer(): Promise<'ok' | 'unauthorized' | 'network_error'> {
  try {
    await authCheckRequest.get('/user/info')
    return 'ok'
  } catch (error: any) {
    if (error?.response?.status === 401) return 'unauthorized'
    return 'network_error'
  }
}

// Auto-skip login for intranet use
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

export const beforeEach = async (to, _from, next) => {
  const token = localStorage.getItem('ctm-token')
  const isSkippedLogin = localStorage.getItem('login-skipped') === 'true'
  const isDev = import.meta.env.MODE === 'development'
  if (to.path === '/login') {
    // Auto-skip login for intranet use
    const success = await autoSkipLogin()
    if (success) {
      scheduleAiModelWarmup()
      next('/')
      return
    }
    if (isSkippedLogin) {
      localStorage.removeItem('login-skipped')
      localStorage.removeItem('ctm-token')
      localStorage.removeItem('jms-token')
      localStorage.removeItem('userInfo')
    }
    next()
    return
  }

  if (isSkippedLogin && token === 'guest_token') {
    try {
      const api = window.api as any
      const dbResult = await api.initUserDatabase({ uid: 999999999 })
      logger.info('Database initialization result', { success: dbResult.success })

      if (dbResult.success) {
        scheduleAiModelWarmup()
        if (to.path === '/') {
          next()
        } else {
          next('/')
        }
      } else {
        logger.error('Database initialization failed, redirecting to login page')
        localStorage.removeItem('login-skipped')
        localStorage.removeItem('ctm-token')
        localStorage.removeItem('jms-token')
        localStorage.removeItem('userInfo')
        next('/login')
      }
    } catch (error) {
      logger.error('Database initialization failed', { error: error })
      localStorage.removeItem('login-skipped')
      localStorage.removeItem('ctm-token')
      localStorage.removeItem('jms-token')
      localStorage.removeItem('userInfo')
      next('/login')
    }
    return
  }

  if (token && !isSkippedLogin) {
    try {
      const userInfo = getUserInfo()
      if (userInfo && userInfo.uid) {
        const api = window.api as any
        const dbResult = await api.initUserDatabase({ uid: userInfo.uid })

        if (dbResult.success) {
          const tokenStatus = await verifyTokenWithServer()
          if (tokenStatus === 'unauthorized') {
            logger.warn('Token expired on startup, redirecting to login')
            await dataSyncService.disableDataSync().catch((error) => {
              logger.error('Failed to disable data sync after token expiry', { error })
            })
            dataSyncService.reset()
            removeToken()
            next('/login')
            return
          }

          dataSyncService.initialize().catch((error) => {
            logger.error('Data sync service initialization failed', { error: error })
          })
          if (tokenStatus === 'ok') {
            scheduleAiModelWarmup()
          }
          next()
        } else {
          logger.error('Database initialization failed, redirecting to login page')
          next('/login')
        }
      } else {
        next('/login')
      }
    } catch (error) {
      logger.error('Processing failed', { error: error })

      const message = error instanceof Error ? error.message : String(error)

      if (isDev && (message.includes('nextSibling') || message.includes('getUserInfo'))) {
        next()
        return
      }
      next('/login')
    }
  } else {
    // Auto-skip login for intranet use - no token exists
    const success = await autoSkipLogin()
    if (success) {
      scheduleAiModelWarmup()
      next('/')
    } else {
      next('/login')
    }
  }
}

export const afterEach = () => {}
