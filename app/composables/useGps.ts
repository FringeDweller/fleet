import { Geolocation } from '@capacitor/geolocation'

export const useGps = () => {
  const watchId = ref<string | null>(null)
  const lastLocation = ref<Record<string, unknown> | null>(null)
  const { queueOperation } = useOfflineSync()
  const { activeSession } = useOperatorSession()

  const startTracking = async () => {
    if (watchId.value) return

    watchId.value = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      },
      (position, err) => {
        if (err) {
          console.error('GPS Watch Error:', err)
          return
        }
        if (position) {
          handleNewLocation(position)
        }
      }
    )
  }

  const stopTracking = async () => {
    if (watchId.value) {
      await Geolocation.clearWatch({ id: watchId.value })
      watchId.value = null
    }
  }

  // biome-ignore lint:  @typescript-eslint/no-explicit-any
  const handleNewLocation = async (position: any) => {
    const coords = position.coords as Record<string, unknown>
    lastLocation.value = coords

    // Only track if there's an active session
    if (!activeSession.value) return

    const data = {
      assetId: activeSession.value.assetId as string,
      sessionId: activeSession.value.id as string,
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      speed: coords.speed ? String(coords.speed) : undefined,
      heading: coords.heading ? String(coords.heading) : undefined,
      altitude: coords.altitude ? String(coords.altitude) : undefined
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
