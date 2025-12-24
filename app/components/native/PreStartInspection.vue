<script setup lang="ts">
const { currentInspection, startInspection, recordCheckpoint, submitInspection, loading: inspectionLoading } = usePreStartInspection()
const { scanTag, isScanning: nfcScanning } = useNfc()
const { startScan: scanQr, isScanning: qrScanning } = useQrScanner()
const { getCurrentPosition, loading: locationLoading } = useGeolocation()
const toast = useToast()

const step = ref(1) // 1: Start, 2: Checkpoints, 3: Checklist, 4: Sign-off
const checklist = ref<{ id: string, label: string, status: 'passed' | 'failed' | null }[]>([])
const loading = computed(() => inspectionLoading.value || locationLoading.value)

const onStartScan = async (method: 'nfc' | 'qr') => {
  try {
    const id = method === 'nfc' ? await scanTag() : await scanQr()
    if (id) {
      const location = await getCurrentPosition()
      await startInspection(id, location || undefined)
      
      // REQ-901-AC-03: Correct checklist loaded for vehicle type
      // Mocking fetching based on asset ID. In real app, call an API.
      checklist.value = [
        { id: 'lights', label: 'Lights & Indicators', status: null },
        { id: 'tires', label: 'Tire Condition & Pressure', status: null },
        { id: 'fluids', label: 'Fluid Levels (Oil, Coolant, Brake)', status: null },
        { id: 'brakes', label: 'Brake Operation', status: null },
        { id: 'mirrors', label: 'Mirrors & Windows', status: null }
      ]
      
      step.value = 2
    }
  } catch (error: any) {
    toast.add({ title: 'Scan Failed', description: error.message, color: 'error' })
  }
}

const onCheckpointScan = async (method: 'nfc' | 'qr') => {
  try {
    const id = method === 'nfc' ? await scanTag() : await scanQr()
    if (id) {
      const location = await getCurrentPosition()
      await recordCheckpoint(id, location || undefined)
      toast.add({ title: `Checkpoint ${id} Recorded`, color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Checkpoint Scan Failed', description: error.message, color: 'error' })
  }
}

const finishCheckpoints = () => {
  step.value = 3
}

const finishChecklist = () => {
  const failed = checklist.value.some(i => i.status === 'failed')
  if (failed) {
    // FEA-OPS-07: Defect escalation workflow (simplified here)
    toast.add({ title: 'Defects found. Please provide details.', color: 'warning' })
  }
  step.value = 4
}

const submit = async () => {
  const failed = checklist.value.some(i => i.status === 'failed')
  await submitInspection(failed ? 'failed' : 'passed', checklist.value)
  toast.add({ title: 'Inspection submitted successfully', color: 'success' })
  step.value = 1
}
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- Step 1: Start -->
    <div v-if="step === 1" class="space-y-4 text-center">
      <h2 class="text-xl font-bold">Pre-Start Inspection</h2>
      <p class="text-dimmed">Scan vehicle NFC tag or QR code to begin daily inspection.</p>
      
      <div class="grid grid-cols-2 gap-4">
        <UButton
          size="xl"
          icon="i-lucide-nfc"
          label="NFC Tap"
          block
          :loading="nfcScanning"
          @click="onStartScan('nfc')"
        />
        <UButton
          size="xl"
          icon="i-lucide-qr-code"
          label="QR Scan"
          block
          :loading="qrScanning"
          @click="onStartScan('qr')"
        />
      </div>
    </div>

    <!-- Step 2: Checkpoints -->
    <div v-if="step === 2" class="space-y-4">
      <h2 class="text-xl font-bold">Walk-Around Verification</h2>
      <p class="text-dimmed">Scan all required checkpoints on the vehicle.</p>
      <div class="bg-elevated p-4 rounded-lg">
        <p class="text-sm font-medium">Scanned: {{ currentInspection?.checkpoints?.length || 0 }}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <UButton
          size="lg"
          icon="i-lucide-nfc"
          label="NFC Tap"
          block
          :loading="nfcScanning"
          @click="onCheckpointScan('nfc')"
        />
        <UButton
          size="lg"
          icon="i-lucide-qr-code"
          label="QR Scan"
          block
          :loading="qrScanning"
          @click="onCheckpointScan('qr')"
        />
      </div>

      <UButton
        label="Next: Checklist"
        block
        color="neutral"
        :disabled="!currentInspection?.checkpoints?.length"
        @click="finishCheckpoints"
      />
    </div>

    <!-- Step 3: Checklist -->
    <div v-if="step === 3" class="space-y-4">
      <h2 class="text-xl font-bold">Inspection Checklist</h2>
      <div class="space-y-4">
        <div v-for="item in checklist" :key="item.id" class="border-b border-default pb-4">
          <p class="font-medium mb-2">{{ item.label }}</p>
          <div class="flex gap-2">
            <UButton
              label="Pass"
              :color="item.status === 'passed' ? 'success' : 'neutral'"
              variant="soft"
              class="flex-1"
              @click="item.status = 'passed'"
            />
            <UButton
              label="Fail"
              :color="item.status === 'failed' ? 'error' : 'neutral'"
              variant="soft"
              class="flex-1"
              @click="item.status = 'failed'"
            />
          </div>
        </div>
      </div>
      <UButton
        label="Next: Sign-off"
        block
        :disabled="checklist.some(i => i.status === null)"
        @click="finishChecklist"
      />
    </div>

    <!-- Step 4: Sign-off -->
    <div v-if="step === 4" class="space-y-4 text-center">
      <h2 class="text-xl font-bold">Sign-off</h2>
      <p class="text-dimmed">I confirm that I have physically inspected this vehicle.</p>
      <div class="h-40 border-2 border-dashed border-default rounded-lg flex items-center justify-center italic text-dimmed">
        Digital Signature Placeholder
      </div>
      <UButton
        label="Submit Inspection"
        size="xl"
        block
        :loading="loading"
        @click="submit"
      />
    </div>
  </div>
</template>
