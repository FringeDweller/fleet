import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export const useCapacitor = () => {
  const isNative = computed(() => Capacitor.isNativePlatform())
  const platform = computed(() => Capacitor.getPlatform())
  const isIos = computed(() => platform.value === 'ios')
  const isAndroid = computed(() => platform.value === 'android')

  const closeApp = () => {
    if (isNative.value) {
      App.exitApp()
    }
  }

  return {
    isNative,
    platform,
    isIos,
    isAndroid,
    closeApp
  }
}
