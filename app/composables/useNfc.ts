import { Capacitor } from '@capacitor/core'
import { CapacitorNfc } from '@capgo/capacitor-nfc'

const toHexString = (byteArray: number[]) => {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

export const useNfc = () => {
  const isAvailable = ref(false)
  const isScanning = ref(false)

  onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
      isAvailable.value = true
    }
  })

  const scanTag = async (): Promise<string> => {
    if (!isAvailable.value) {
      console.warn('NFC not available')
      return ''
    }

    return new Promise(async (resolve, reject) => {
      isScanning.value = true
      
      const listener = await CapacitorNfc.addListener('tagDiscovered', (event) => {
        isScanning.value = false
        listener.remove()
        
        let id = ''
        if (event.tag && event.tag.id) {
          id = toHexString(event.tag.id)
        }
        resolve(id || JSON.stringify(event.tag))
      })

      CapacitorNfc.startScanning().catch((err: any) => {
        isScanning.value = false
        reject(err)
      })
    })
  }

  const stopScan = async () => {
    if (isScanning.value) {
      await CapacitorNfc.stopScanning()
      isScanning.value = false
    }
  }

  return {
    isAvailable,
    isScanning,
    scanTag,
    stopScan
  }
}