<script setup lang="ts">
const {
  isAvailable,
  isScanning,
  isConnected,
  devices,
  connectedDevice,
  scanForDongles,
  connect,
  disconnect
} = useBluetoothObd()

const toast = useToast()
const connecting = ref(false)

const handleScan = async () => {
  await scanForDongles()
}

const handleConnect = async (deviceId: string) => {
  connecting.value = true
  try {
    await connect(deviceId)
    toast.add({ title: 'Connected to OBD Dongle', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Connection Failed', description: e.message, color: 'error' })
  } finally {
    connecting.value = false
  }
}

const handleDisconnect = async () => {
  await disconnect()
  toast.add({ title: 'Disconnected', color: 'neutral' })
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div v-if="!isAvailable" class="text-center p-8 text-dimmed">
      <UIcon name="i-lucide-bluetooth-off" class="w-12 h-12 mx-auto mb-2" />
      <p>Bluetooth not available on this device.</p>
    </div>

    <div v-else-if="isConnected && connectedDevice" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-800 rounded-full">
            <UIcon name="i-lucide-bluetooth-connected" class="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <h3 class="font-bold">
              Connected
            </h3>
            <p class="text-sm text-dimmed">
              {{ connectedDevice.name || connectedDevice.deviceId }}
            </p>
          </div>
        </div>
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-log-out"
          @click="handleDisconnect"
        />
      </div>

      <ObdLiveData />

      <ObdDiagnostics />
    </div>

    <div v-else class="space-y-4">
      <UButton
        block
        size="xl"
        :loading="isScanning"
        :icon="isScanning ? 'i-lucide-loader-2' : 'i-lucide-search'"
        :label="isScanning ? 'Scanning...' : 'Scan for OBD Devices'"
        @click="handleScan"
      />

      <div v-if="devices.length > 0" class="space-y-2">
        <p class="text-sm font-medium text-dimmed">
          Available Devices
        </p>
        <div v-for="device in devices" :key="device.deviceId" class="flex items-center justify-between p-3 bg-elevated rounded-lg border border-default">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-bluetooth" class="w-5 h-5 text-blue-500" />
            <div>
              <p class="font-medium">
                {{ device.name || 'Unknown Device' }}
              </p>
              <p class="text-xs text-dimmed">
                {{ device.deviceId }}
              </p>
            </div>
          </div>
          <UButton
            label="Connect"
            size="sm"
            variant="soft"
            :loading="connecting"
            @click="handleConnect(device.deviceId)"
          />
        </div>
      </div>

      <div v-else-if="!isScanning" class="text-center py-8 text-dimmed">
        No devices found. Ensure your OBD dongle is plugged in and ready to pair.
      </div>
    </div>
  </div>
</template>
