import { getUserInfo, setUserInfo } from '@/utils/permission'
import { dataSyncService } from '@/services/dataSyncService'

const logger = createRendererLogger('router')

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
          // After database initialization succeeds, asynchronously initialize data sync service (non-blocking UI display)
          dataSyncService.initialize().catch((error) => {
            logger.error('Data sync service initialization failed', { error: error })
          })
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

      // In the development environment, bypass the relevant errors (usually caused by hot updates)
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
      next('/')
    } else {
      next('/login')
    }
  }
}

export const afterEach = () => {}
