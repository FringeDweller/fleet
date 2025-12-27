<script setup lang="ts">
const {
  currentInspection,
  startInspection,
  recordCheckpoint,
  submitInspection,
  loading: inspectionLoading
} = usePreStartInspection()
const { scanTag, isScanning: nfcScanning } = useNfc()
const { startScan: scanQr, isScanning: qrScanning } = useQrScanner()
const { getCurrentPosition, loading: locationLoading } = useGeolocation()
const { takePhoto } = useNativeCamera()
const toast = useToast()

const step = ref(1) // 1: Start, 2: Checkpoints, 3: Checklist, 4: Sign-off
const checklist = ref<
  {
    id: string
    label: string
    status: 'passed' | 'failed' | null
    photo?: string
    comment?: string
  }[]
>([])
const _loading = computed(() => inspectionLoading.value || locationLoading.value)

const signatureCaptured = ref(false)

const _onStartScan = async (method: 'nfc' | 'qr') => {
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
  } catch (error: unknown) {
    toast.add({ title: 'Scan Failed', description: (error as Error).message, color: 'error' })
  }
}

const _onCheckpointScan = async (method: 'nfc' | 'qr') => {
  try {
    const id = method === 'nfc' ? await scanTag() : await scanQr()
    if (id) {
      const location = await getCurrentPosition()
      await recordCheckpoint(id, location || undefined)
      toast.add({ title: `Checkpoint ${id} Recorded`, color: 'success' })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Checkpoint Scan Failed',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

const _handleFail = async (item: { status: string | null; photo?: string }) => {
  item.status = 'failed'
  // REQ-902-AC-03: Failed items require photo
  if (!item.photo) {
    try {
      const photo = await takePhoto()
      if (photo) {
        item.photo = photo
      }
    } catch (e) {
      console.error('Failed to take photo', e)
    }
  }
}

const _finishCheckpoints = () => {
  step.value = 3
}

const _finishChecklist = () => {
  const failedWithoutComment = checklist.value.some((i) => i.status === 'failed' && !i.comment)
  if (failedWithoutComment) {
    toast.add({
      title: 'Comment required',
      description: 'Please provide details for failed items.',
      color: 'warning'
    })
    return
  }
  step.value = 4
}

const _submit = async () => {
  if (!signatureCaptured.value) {
    toast.add({ title: 'Signature required', color: 'warning' })
    return
  }
  const failed = checklist.value.some((i) => i.status === 'failed')
  await submitInspection(failed ? 'failed' : 'passed', checklist.value, 'mock-signature-url')
  toast.add({ title: 'Inspection submitted successfully', color: 'success' })
  step.value = 1
  signatureCaptured.value = false
}
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- Step 1: Start -->
    <div v-if="step === 1" class="space-y-4 text-center">
      <h2 class="text-xl font-bold">
        Pre-Start Inspection
      </h2>
      <p class="text-dimmed">
        Scan vehicle NFC tag or QR code to begin daily inspection.
      </p>

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
      <h2 class="text-xl font-bold">
        Walk-Around Verification
      </h2>
      <p class="text-dimmed">
        Scan all required checkpoints on the vehicle.
      </p>
      <div class="bg-elevated p-4 rounded-lg">
        <p class="text-sm font-medium">
          Scanned: {{ (currentInspection?.checkpoints as any[])?.length || 0 }}
        </p>
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

      <div class="flex gap-2">
        <UButton
          label="Back"
          variant="outline"
          class="flex-1"
          @click="step = 1"
        />
        <UButton
          label="Next: Checklist"
          color="neutral"
          class="flex-[2]"
          :disabled="!(currentInspection?.checkpoints as any[])?.length"
          @click="finishCheckpoints"
        />
      </div>
    </div>

    <!-- Step 3: Checklist -->
    <div v-if="step === 3" class="space-y-4">
      <h2 class="text-xl font-bold">
        Inspection Checklist
      </h2>
      <div class="space-y-6">
        <div v-for="item in checklist" :key="item.id" class="border-b border-default pb-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="font-medium">
              {{ item.label }}
            </p>
            <UBadge v-if="item.status === 'failed'" color="error" variant="soft">
              Defect
            </UBadge>
          </div>

          <div class="flex gap-2">
            <UButton
              label="Pass"
              :color="item.status === 'passed' ? 'success' : 'neutral'"
              variant="soft"
              class="flex-1"
              icon="i-lucide-check-circle"
              @click="item.status = 'passed'"
            />
            <UButton
              label="Fail"
              :color="item.status === 'failed' ? 'error' : 'neutral'"
              variant="soft"
              class="flex-1"
              icon="i-lucide-alert-triangle"
              @click="handleFail(item)"
            />
          </div>

          <div v-if="item.status === 'failed'" class="space-y-3 pt-2">
            <UFormField label="Notes / Defect Details">
              <UTextarea v-model="item.comment" placeholder="Describe the issue..." />
            </UFormField>

            <div v-if="item.photo" class="relative w-full aspect-video rounded-lg overflow-hidden border border-default">
              <img :src="item.photo" class="object-cover w-full h-full">
              <UButton
                icon="i-lucide-camera"
                class="absolute bottom-2 right-2"
                size="xs"
                @click="handleFail(item)"
              >
                Retake
              </UButton>
            </div>
            <UButton
              v-else
              icon="i-lucide-camera"
              label="Capture Photo"
              block
              variant="outline"
              @click="handleFail(item)"
            />
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          label="Back"
          variant="outline"
          class="flex-1"
          @click="step = 2"
        />
        <UButton
          label="Next: Sign-off"
          class="flex-[2]"
          size="lg"
          :disabled="checklist.some(i => i.status === null)"
          @click="finishChecklist"
        />
      </div>
    </div>

    <!-- Step 4: Sign-off -->
    <div v-if="step === 4" class="space-y-4">
      <h2 class="text-xl font-bold">
        Sign-off
      </h2>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        <p class="font-bold mb-1">
          Declaration:
        </p>
        <p>I confirm that I have physically inspected this vehicle and the information provided is accurate to the best of my knowledge.</p>
      </div>

      <div
        class="h-48 border-2 border-dashed border-default rounded-lg flex flex-col items-center justify-center bg-elevated cursor-pointer"
        @click="signatureCaptured = true"
      >
        <div v-if="!signatureCaptured" class="text-center p-4">
          <UIcon name="i-lucide-pen-tool" class="w-8 h-8 mb-2 text-dimmed mx-auto" />
          <p class="text-sm text-dimmed">
            Tap to Sign
          </p>
        </div>
        <div v-else class="text-center p-4 w-full">
          <div class="h-20 flex items-center justify-center">
            <span class="text-3xl font-signature italic">John Doe</span>
          </div>
          <p class="text-xs text-dimmed mt-2 border-t border-default pt-2">
            Digitally Signed at {{ new Date().toLocaleTimeString() }}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <UButton
          label="Back"
          variant="outline"
          class="flex-1"
          @click="step = 3"
        />
        <UButton
          label="Submit Inspection"
          size="lg"
          class="flex-[2]"
          :loading="loading"
          :disabled="!signatureCaptured"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>
