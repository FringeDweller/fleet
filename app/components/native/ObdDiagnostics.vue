<script setup lang="ts">
import { useBluetoothObd } from '~/composables/useBluetoothObd'

const { dtcCodes, clearDtcCodes, isConnected } = useBluetoothObd()
const isClearing = ref(false)
const showClearModal = ref(false)
const workOrderRef = ref('')
const toast = useToast()
const { activeSession } = useOperatorSession()

const handleClear = async () => {
  if (!workOrderRef.value) return

  isClearing.value = true
  try {
    // 1. Clear local
    await clearDtcCodes()

    // 2. Sync to backend with WO ref
    if (activeSession.value) {
      await $fetch('/api/obd/clear-codes', {
        method: 'POST',
        body: {
          assetId: activeSession.value.assetId,
          workOrderRef: workOrderRef.value
        }
      })
    }

    toast.add({ title: 'Codes Cleared', color: 'success' })
    showClearModal.value = false
    workOrderRef.value = ''
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Failed to clear codes', color: 'error' })
  } finally {
    isClearing.value = false
  }
}
</script>

<template>
  <div v-if="isConnected">
    <div v-if="dtcCodes.length > 0" class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-red-600 dark:text-red-400">
            Diagnostic Trouble Codes
          </h3>
          <UButton
            color="error"
            variant="soft"
            label="Clear Codes"
            icon="i-lucide-trash-2"
            @click="showClearModal = true"
          />
        </div>
        <div class="space-y-2">
          <div v-for="code in dtcCodes" :key="code" class="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded border border-red-100 dark:border-red-900">
            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
            <span class="font-mono font-bold">{{ code }}</span>
          </div>
        </div>
      </div>

      <UModal v-model="showClearModal">
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-bold">
            Clear Diagnostic Codes?
          </h3>
          <p class="text-sm text-dimmed">
            This will reset the check engine light. Please provide a Work Order reference for this action.
          </p>

          <UFormGroup label="Work Order Reference" required>
            <UInput v-model="workOrderRef" placeholder="e.g. WO-1234" />
          </UFormGroup>

          <div class="flex justify-end gap-2 pt-4">
            <UButton label="Cancel" variant="ghost" @click="showClearModal = false" />
            <UButton
              label="Confirm & Clear"
              color="error"
              :loading="isClearing"
              :disabled="!workOrderRef"
              @click="handleClear"
            />
          </div>
        </div>
      </UModal>
    </div>
    <div v-else class="text-center p-4 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
      <UIcon name="i-lucide-check-circle" class="w-8 h-8 mx-auto mb-2" />
      <p class="font-medium">
        No Fault Codes Detected
      </p>
    </div>
  </div>
</template>
