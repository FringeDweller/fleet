<script setup lang="ts">
defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  (e: 'scan', tagId: string): void
  (e: 'error', error: unknown): void
}>()

const { isAvailable, isScanning, scanTag, stopScan } = useNfc()

const _startScanning = async () => {
  try {
    const tagId = await scanTag()
    if (tagId) {
      emit('scan', tagId)
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
      :label="label || (isScanning ? 'Scanning...' : 'Scan NFC Tag')"
      icon="i-heroicons-signal"
      color="primary"
      @click="startScanning"
    />
    <UButton
      v-if="isScanning"
      label="Cancel"
      color="neutral"
      variant="ghost"
      class="ml-2"
      @click="stopScan"
    />
  </div>
  <div v-else class="text-sm text-gray-500 italic">
    NFC not available on this device
  </div>
</template>
