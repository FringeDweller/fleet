import { CapacitorNfc } from '@capgo/capacitor-nfc'

export const useNfc = () => {
  const isAvailable = ref(false)
  const isScanning = ref(false)
  const lastTag = ref<any>(null)

  onMounted(async () => {
    const status = await CapacitorNfc.getStatus()
    isAvailable.value = status.status === 'NFC_OK'
  })

  const startScan = async () => {
    isScanning.value = true
    await CapacitorNfc.startScanning()
    
    CapacitorNfc.addListener('tagDiscovered', (event) => {
      lastTag.value = event.tag
      stopScan()
    })
  }

  const stopScan = async () => {
    await CapacitorNfc.stopScanning()
    isScanning.value = false
  }

  return {
    isAvailable,
    isScanning,
    lastTag,
    startScan,
    stopScan
  }
}