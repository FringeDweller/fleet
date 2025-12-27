import { PushNotifications } from '@capacitor/push-notifications'

export const usePushNotifications = () => {
  const { isNative } = useCapacitor()
  const { unreadCount } = useNotifications()
  const token = ref<string | null>(null)

  const register = async () => {
    if (!isNative.value) return

    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions()
    }

    if (perm.receive !== 'granted') {
      throw new Error('User denied permissions!')
    }

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (t) => {
      token.value = t.value
      console.log(`Push registration success, token: ${t.value}`)

      // Save token to backend
      const { platform } = await useCapacitor()
      await $fetch('/api/auth/push-token', {
        method: 'POST',
        body: {
          token: t.value,
          platform: platform.value
        }
      })
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error: ', err.error)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification)
      const link = notification.notification.data?.link
      if (link) {
        navigateTo(link)
      }
    })
  }

  // Update badge count
  watch(unreadCount, (count) => {
    if (isNative.value) {
      PushNotifications.removeAllDeliveredNotifications() // Optional: clear notifications if desired
      // PushNotifications.setBadge({ count }) // Note: check plugin support for setBadge
    }
  }, { immediate: true })

  return {
    register,
    token
  }
}
