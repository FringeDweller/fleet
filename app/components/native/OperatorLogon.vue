<script setup lang="ts">
const { logOn, logOff, activeSession, loading: sessionLoading } = useOperatorSession()
const { scanTag, isScanning: nfcScanning } = useNfc()
const { startScan: scanQr, isScanning: qrScanning } = useQrScanner()
const { isConnected: obdConnected, liveData: obdData } = useBluetoothObd()
const { clear } = useUserSession()
const toast = useToast()
const handoverContext = useCookie<{
  assetId: string
  odometer?: string
  hours?: string
  sessionId: string
  timestamp: number
} | null>('handover-context')

const assetId = ref('')
const startOdometer = ref('')
const startHours = ref('')
const endOdometer = ref('')
const endHours = ref('')
const showManualForm = ref(false)
const showLogOffForm = ref(false)

// Check for handover context on mount
onMounted(() => {
  if (handoverContext.value) {
    const ctx = handoverContext.value
    // Only use if less than 15 minutes old
    if (Date.now() - ctx.timestamp < 15 * 60 * 1000) {
      assetId.value = ctx.assetId
      startOdometer.value = ctx.odometer || ''
      startHours.value = ctx.hours || ''
      showManualForm.value = true
      toast.add({
        title: 'Shift Handover',
        description: 'Continuing from previous operator.',
        color: 'info'
      })
    } else {
      handoverContext.value = null // Expired
    }
  }
})

// Auto-populate odometer if OBD is connected
watch(showManualForm, (val) => {
  if (val && obdConnected.value && !startOdometer.value) {
    startOdometer.value = obdData.value.odometer.toFixed(2)
  }
})

watch(showLogOffForm, (val) => {
  if (val && obdConnected.value && !endOdometer.value) {
    endOdometer.value = obdData.value.odometer.toFixed(2)
  }
})

const onNfcScan = async () => {
  try {
    const id = await scanTag()
    if (id) {
      await handleLogOn(id)
    }
  } catch (error: unknown) {
    toast.add({ title: 'NFC Scan Failed', description: (error as Error).message, color: 'error' })
  }
}

const onQrScan = async () => {
  try {
    const id = await scanQr()
    if (id) {
      await handleLogOn(id)
    }
  } catch (error: unknown) {
    toast.add({ title: 'QR Scan Failed', description: (error as Error).message, color: 'error' })
  }
}

const handleLogOn = async (id: string) => {
  assetId.value = id
  showManualForm.value = true
}

const submitLogOn = async () => {
  try {
    const previousSessionId =
      handoverContext.value?.assetId === assetId.value ? handoverContext.value.sessionId : undefined

    await logOn(assetId.value, {
      startOdometer: startOdometer.value,
      startHours: startHours.value,
      previousSessionId
    })

    // Clear context after successful login
    if (previousSessionId) handoverContext.value = null

    toast.add({ title: 'Logged on successfully', color: 'success' })
    showManualForm.value = false
  } catch (error: unknown) {
    toast.add({ title: 'Log on failed', description: (error as Error).message, color: 'error' })
  }
}

const submitLogOff = async () => {
  try {
    await logOff({
      endOdometer: endOdometer.value,
      endHours: endHours.value
    })
    toast.add({ title: 'Logged off successfully', color: 'success' })
    showLogOffForm.value = false
  } catch (error: unknown) {
    toast.add({ title: 'Log off failed', description: (error as Error).message, color: 'error' })
  }
}

const onHandover = async () => {
  if (!endOdometer.value && !endHours.value && !obdConnected.value) {
    toast.add({
      title: 'Readings required',
      description: 'Please enter odometer or hours for handover.',
      color: 'warning'
    })
    return
  }

  try {
    const sessionId = activeSession.value?.id as string
    const asset = activeSession.value?.assetId as string

    // 1. Log off current session
    await logOff({
      endOdometer: endOdometer.value,
      endHours: endHours.value
    })

    // 2. Set handover context
    if (sessionId && asset) {
      handoverContext.value = {
        assetId: asset,
        sessionId: sessionId,
        odometer: endOdometer.value,
        hours: endHours.value,
        timestamp: Date.now()
      }

      // 3. Logout user
      await clear()

      // 4. Redirect
      navigateTo('/login')
    }
  } catch (error: unknown) {
    toast.add({ title: 'Handover failed', description: (error as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="p-4 space-y-6">
    <div v-if="!activeSession" class="space-y-4">
      <h2 class="text-xl font-bold text-center">
        Operator Log-On
      </h2>
      <p class="text-center text-dimmed">
        Tap vehicle NFC tag or scan QR code to start shift.
      </p>

      <div class="grid grid-cols-2 gap-4">
        <UButton
          size="xl"
          icon="i-lucide-nfc"
          label="NFC Tap"
          block
          :loading="nfcScanning"
          @click="onNfcScan"
        />
        <UButton
          size="xl"
          icon="i-lucide-qr-code"
          label="QR Scan"
          block
          :loading="qrScanning"
          @click="onQrScan"
        />
      </div>

      <UModal v-model:open="showManualForm" title="Start Session">
        <template #content>
          <div class="p-4 space-y-4">
            <UFormField label="Asset ID">
              <UInput v-model="assetId" disabled />
            </UFormField>
            <UFormField label="Current Odometer">
              <UInput
                v-model="startOdometer"
                type="number"
                placeholder="0.00"
                :icon="obdConnected ? 'i-lucide-bluetooth' : undefined"
              />
            </UFormField>
            <UFormField label="Engine Hours">
              <UInput v-model="startHours" type="number" placeholder="0.00" />
            </UFormField>
            <div class="flex justify-end gap-2 pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                @click="showManualForm = false"
              />
              <UButton label="Log On" :loading="sessionLoading" @click="submitLogOn" />
            </div>
          </div>
        </template>
      </UModal>
    </div>

    <div v-else class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-green-800 dark:text-green-300">
          Active Session
        </h3>
        <UBadge color="success" variant="subtle">
          Logged On
        </UBadge>
      </div>
      <p class="text-sm">
        Vehicle: {{ activeSession.assetId }}
      </p>
      <p class="text-sm">
        Started: {{ new Date(activeSession.startTime as string).toLocaleString() }}
      </p>
      <div class="pt-2">
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-log-out"
          label="End Shift / Log Off"
          block
          @click="showLogOffForm = true"
        />
      </div>

      <UModal v-model:open="showLogOffForm" title="End Session">
        <template #content>
          <div class="p-4 space-y-4">
            <UFormField label="Final Odometer">
              <UInput
                v-model="endOdometer"
                type="number"
                placeholder="0.00"
                :icon="obdConnected ? 'i-lucide-bluetooth' : undefined"
              />
            </UFormField>
            <UFormField label="Final Engine Hours">
              <UInput v-model="endHours" type="number" placeholder="0.00" />
            </UFormField>
            <div class="flex justify-end gap-2 pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                @click="showLogOffForm = false"
              />
              <UButton
                label="Handover"
                color="warning"
                :loading="sessionLoading"
                @click="onHandover"
              />
              <UButton
                label="Log Off"
                color="error"
                :loading="sessionLoading"
                @click="submitLogOff"
              />
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
