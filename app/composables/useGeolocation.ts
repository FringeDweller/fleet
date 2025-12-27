import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = ref<{ latitude: number, longitude: number } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getCurrentPosition = async () => {
    loading.value = true
    error.value = null
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })
      coords.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      return coords.value
    } catch (e: unknown) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    coords,
    error,
    loading,
    getCurrentPosition
  }
}
