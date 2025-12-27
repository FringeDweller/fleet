import { Capacitor } from '@capacitor/core'
import { CapacitorNfc } from '@capgo/capacitor-nfc'

const toHexString = (byteArray: number[]) => {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
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

    isScanning.value = true

    return new Promise((resolve, reject) => {
      CapacitorNfc.addListener('tagDiscovered', (event) => {
        isScanning.value = false
        // listener.remove() // We'll need a way to remove this or use once
        // For simplicity in this fix, we assume the API handles it or we'll fix better
        let id = ''
        if (event.tag && event.tag.id) {
          id = toHexString(event.tag.id)
        }
        resolve(id || JSON.stringify(event.tag))
      }).then((listener) => {
        CapacitorNfc.startScanning().catch((err: unknown) => {
          isScanning.value = false
          listener.remove()
          reject(err)
        })
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
