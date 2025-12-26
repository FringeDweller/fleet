import { Capacitor } from '@capacitor/core'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

export const useQrScanner = () => {
  const isAvailable = ref(false)
  const isScanning = ref(false)

  onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
      const { supported } = await BarcodeScanner.isSupported()
      isAvailable.value = supported
    }
  })

  const checkPermission = async () => {
    const { camera } = await BarcodeScanner.checkPermissions()
    if (camera === 'granted') return true

    const { camera: newStatus } = await BarcodeScanner.requestPermissions()
    return newStatus === 'granted'
  }

  const startScan = async (): Promise<string> => {
    if (!isAvailable.value) {
      console.warn('QR Scanner not available')
      return ''
    }

    const granted = await checkPermission()
    if (!granted) {
      throw new Error('Camera permission denied')
    }

    isScanning.value = true

    return new Promise(async (resolve, reject) => {
      // Add listener
      const listener = await BarcodeScanner.addListener('barcodesScanned', (result: any) => {
        listener.remove()
        stopScan()
        resolve(result.barcodes[0]?.rawValue || '')
      })

      BarcodeScanner.startScan().catch((err) => {
        isScanning.value = false
        reject(err)
      })
    })
  }

  const stopScan = async () => {
    if (isScanning.value) {
      await BarcodeScanner.stopScan()
      await BarcodeScanner.removeAllListeners()
      isScanning.value = false
    }
  }

  return {
    isAvailable,
    isScanning,
    startScan,
    stopScan
  }
}
