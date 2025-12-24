import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

export const useQrScanner = () => {
  const isAvailable = ref(false)

  onMounted(async () => {
    const result = await BarcodeScanner.isSupported()
    isAvailable.value = result.supported
  })

  const scan = async () => {
    // Request permissions
    await BarcodeScanner.requestPermissions()

    // Scan
    const { barcodes } = await BarcodeScanner.scan()
    return barcodes[0]
  }

  return {
    isAvailable,
    scan
  }
}
