<script setup lang="ts">
const props = defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  (e: 'scan', code: string): void
  (e: 'error', error: any): void
}>()

const { isAvailable, isScanning, startScan, stopScan } = useQrScanner()

const startScanningProcess = async () => {
  try {
    const code = await startScan()
    if (code) {
      emit('scan', code)
    }
  } catch (err) {
    emit('error', err)
  }
}
</script>

<template>
  <div v-if="isAvailable">
    <UButton
      :loading="isScanning"
      :label="label || (isScanning ? 'Scanning...' : 'Scan QR Code')"
      icon="i-heroicons-qr-code"
      color="primary"
      @click="startScanningProcess"
    />
    <UButton
      v-if="isScanning"
      label="Stop"
      color="error"
      variant="soft"
      class="ml-2"
      @click="stopScan"
    />
    
    <!-- Overlay when scanning -->
    <div v-if="isScanning" class="fixed inset-0 z-50 flex flex-col items-center justify-end pb-10 bg-black/50">
       <div class="bg-white p-4 rounded-lg shadow-lg">
         <p class="mb-4 font-semibold">Scanning QR Code...</p>
         <UButton color="error" block @click="stopScan">Cancel Scan</UButton>
       </div>
    </div>
  </div>
  <div v-else class="text-sm text-gray-500 italic">
    QR Scanner not available on this device
  </div>
</template>
