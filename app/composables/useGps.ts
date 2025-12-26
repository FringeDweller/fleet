import { Geolocation } from '@capacitor/geolocation'

export const useGps = () => {
  const watchId = ref<string | null>(null)
  const lastLocation = ref<any>(null)
  const { queueOperation } = useOfflineSync()
  const { activeSession } = useOperatorSession()

  const startTracking = async () => {
    if (watchId.value) return

    watchId.value = await Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }, (position, err) => {
      if (err) {
        console.error('GPS Watch Error:', err)
        return
      }
      if (position) {
        handleNewLocation(position)
      }
    })
  }

  const stopTracking = async () => {
    if (watchId.value) {
      await Geolocation.clearWatch({ id: watchId.value })
      watchId.value = null
    }
  }

  const handleNewLocation = async (position: any) => {
    lastLocation.value = position.coords

    // Only track if there's an active session
    if (!activeSession.value) return

    const data = {
      assetId: activeSession.value.assetId,
      sessionId: activeSession.value.id,
      latitude: position.coords.latitude.toString(),
      longitude: position.coords.longitude.toString(),
      speed: position.coords.speed?.toString(),
      heading: position.coords.heading?.toString(),
      altitude: position.coords.altitude?.toString()
    }

    // Queue for sync (high frequency, maybe throttle?)
    await queueOperation('asset-locations', 'create', data)
  }

  return {
    watchId,
    lastLocation,
    startTracking,
    stopTracking
  }
}
