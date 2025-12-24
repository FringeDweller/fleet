import { PushNotifications } from '@capacitor/push-notifications'

export const usePushNotifications = () => {
  const { isNative } = useCapacitor()
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

    PushNotifications.addListener('registration', (t) => {
      token.value = t.value
      console.log('Push registration success, token: ' + t.value)
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error: ', err.error)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification)
    })
  }

  return {
    register,
    token
  }
}
