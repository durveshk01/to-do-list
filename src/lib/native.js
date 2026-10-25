import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export const isNativePlatform = () => {
  return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.())
}

export const haptic = {
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10)
      }
    }
  },
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25)
      }
    }
  },
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40)
      }
    }
  },
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success })
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 60, 25])
      }
    }
  },
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning })
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 40, 30])
      }
    }
  },
  selection: async () => {
    try {
      await Haptics.selectionStart()
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8)
      }
    }
  },
}

export const updateStatusBar = async (isDark) => {
  try {
    if (!isNativePlatform()) return
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    try {
      await StatusBar.setBackgroundColor({ color: isDark ? '#080c17' : '#ffffff' })
    } catch {
      // Background color setting is ignored on Android 15+ edge-to-edge
    }
  } catch {
    // Ignore in non-native or unsupported environments
  }
}

export const initNativeSystemBars = async () => {
  if (typeof document === 'undefined') return
  if (isNativePlatform()) {
    document.documentElement.classList.add('native-platform')
    try {
      const info = await StatusBar.getInfo()
      if (info && typeof info.height === 'number' && info.height > 0) {
        document.documentElement.style.setProperty('--safe-area-inset-top', `${info.height}px`)
        document.documentElement.style.setProperty('--status-bar-height', `${info.height}px`)
      }
    } catch {
      // Fallback to CSS env()
    }
  }
}

export const hideSplashScreen = async () => {
  try {
    if (!isNativePlatform()) return
    await SplashScreen.hide()
  } catch {
    // Ignore in non-native or unsupported environments
  }
}

export const setupBackButton = (handler) => {
  try {
    if (!isNativePlatform()) return () => {}
    const listenerPromise = CapApp.addListener('backButton', handler)
    return () => {
      listenerPromise.then((listener) => listener.remove?.()).catch(() => {})
    }
  } catch {
    return () => {}
  }
}
