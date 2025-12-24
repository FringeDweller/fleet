import { BleClient, type BleDevice, type ScanResult } from '@capacitor-community/bluetooth-le'

// Standard OBD-II UUIDs (often generic serial port service for ELM327)
const OBD_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb' // Example, often varies by dongle
// Many ELM327 dongles use 0xFFF0 or SPP UUIDs. We'll need to scan and filter.

export const useBluetoothObd = () => {
  const isAvailable = ref(false)
  const isScanning = ref(false)
  const isConnected = ref(false)
  const connectedDevice = ref<BleDevice | null>(null)
  const devices = ref<BleDevice[]>([])
  const { isNative, isAndroid } = useCapacitor()
  
  const lastDeviceId = useCookie('last-obd-device')

  const init = async () => {
    if (!isNative.value) return
    try {
      await BleClient.initialize()
      isAvailable.value = true
      
      // Auto-connect if previously connected
      if (lastDeviceId.value) {
        // We might need to scan first or just try connecting
        // For simplicity, we try to connect directly if supported or scan+connect
        try {
           // Direct connect might fail if device not found in cache, often scan is safer
           // But let's try direct first if platform allows
           await connect(lastDeviceId.value)
        } catch (e) {
           console.log('Auto-connect failed', e)
        }
      }
    } catch (e) {
      console.error('BLE Init failed', e)
    }
  }

  const scanForDongles = async () => {
    if (!isAvailable.value) return
    isScanning.value = true
    devices.value = []

    try {
      // Scan for 5 seconds
      await BleClient.requestLEScan({}, (result) => {
        if (result.device && result.device.name) {
          // Filter for common OBD dongle names or allow all
          if (!devices.value.some(d => d.deviceId === result.device.deviceId)) {
            devices.value.push(result.device)
          }
        }
      })

      setTimeout(async () => {
        await BleClient.stopLEScan()
        isScanning.value = false
      }, 5000)
    } catch (e) {
      console.error('Scan failed', e)
      isScanning.value = false
    }
  }

  const connect = async (deviceId: string) => {
    try {
      await BleClient.connect(deviceId, (deviceId) => {
        console.log('Device disconnected', deviceId)
        isConnected.value = false
        connectedDevice.value = null
      })
      
      const device = devices.value.find(d => d.deviceId === deviceId)
      if (device) {
        connectedDevice.value = device
        isConnected.value = true
        lastDeviceId.value = deviceId
      }
      
      // Here we would discover services and characteristics to find the RW characteristic
      // For now, we just establish connection
      
    } catch (e) {
      console.error('Connection failed', e)
      throw e
    }
  }

  const disconnect = async () => {
    if (connectedDevice.value) {
      await BleClient.disconnect(connectedDevice.value.deviceId)
      isConnected.value = false
      connectedDevice.value = null
      lastDeviceId.value = null
    }
  }

  const liveData = ref<{ rpm: number, speed: number, temp: number, fuel: number, odometer: number }>({ rpm: 0, speed: 0, temp: 0, fuel: 0, odometer: 125000.5 })
  const dtcCodes = ref<string[]>([])
  const pollingInterval = ref<any>(null)
  const { activeSession } = useOperatorSession()

  // Sync DTCs to backend when they change
  watch(dtcCodes, async (newCodes) => {
    if (newCodes.length > 0 && activeSession.value) {
      try {
        await $fetch('/api/obd/readings', {
          method: 'POST',
          body: {
            assetId: activeSession.value.assetId,
            dtcCodes: newCodes,
            odometer: liveData.value.odometer,
            fuelLevel: liveData.value.fuel
          }
        })
      } catch (e) {
        console.error('Failed to sync OBD readings', e)
      }
    }
  }, { deep: true })

  const startPolling = async () => {
    if (!isConnected.value || !connectedDevice.value) return

    // Simulation for development/demo without real dongle
    pollingInterval.value = setInterval(() => {
      liveData.value = {
        rpm: Math.floor(Math.random() * (3000 - 800) + 800),
        speed: Math.floor(Math.random() * 100),
        temp: Math.floor(Math.random() * (110 - 80) + 80),
        fuel: Math.floor(Math.random() * 100),
        odometer: liveData.value.odometer + (liveData.value.speed / 3600)
      }

      // Randomly simulate a DTC appearing (rare)
      if (Math.random() > 0.99 && dtcCodes.value.length === 0) {
        dtcCodes.value = ['P0300'] // Random/Multiple Cylinder Misfire Detected
      }
    }, 1000)
  }

  const readDtcCodes = async () => {
    // In a real app, send PID 03 to get stored trouble codes
    return dtcCodes.value
  }

  const clearDtcCodes = async () => {
    // In a real app, send PID 04
    dtcCodes.value = []
    return true
  }

  const readOdometer = async () => {
    // In a real app, this would perform a one-off read of PID 01A6 or similar
    // For now, return the current live value
    return liveData.value.odometer
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  // Hook into connect/disconnect
  watch(isConnected, (connected) => {
    if (connected) {
      startPolling()
    } else {
      stopPolling()
    }
  })

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    isAvailable,
    isScanning,
    isConnected,
    connectedDevice,
    devices,
    liveData,
    dtcCodes,
    scanForDongles,
    connect,
    disconnect,
    readOdometer,
    readDtcCodes,
    clearDtcCodes
  }
}
