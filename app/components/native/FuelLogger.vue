<script setup lang="ts">
const { recordTransaction, loading: _loading } = useFuel()
const { activeSession } = useOperatorSession()
const { scanTag, isScanning: _nfcScanning } = useNfc()
const { startScan: scanQr, isScanning: _qrScanning } = useQrScanner()
const { takePhoto } = useNativeCamera()
const toast = useToast()

const assetId = ref((activeSession.value?.assetId as string) || '')
const quantity = ref('')
const totalCost = ref('')
const odometer = ref('')
const fuelType = ref('diesel')
const stationName = ref('')
const receiptImage = ref('')

const _fuelTypes = [
  { label: 'Diesel', value: 'diesel' },
  { label: 'Unleaded', value: 'unleaded' },
  { label: 'AdBlue', value: 'adblue' },
  { label: 'LPG', value: 'lpg' }
]

const _onScan = async (method: 'nfc' | 'qr') => {
  try {
    const id = method === 'nfc' ? await scanTag() : await scanQr()
    if (id) {
      assetId.value = id
      toast.add({ title: 'Vehicle Identified', description: `Asset ID: ${id}`, color: 'success' })
    }
  } catch (error: unknown) {
    toast.add({ title: 'Scan Failed', description: (error as Error).message, color: 'error' })
  }
}

const _onCaptureReceipt = async () => {
  try {
    const photo = await takePhoto()
    if (photo) {
      receiptImage.value = photo
    }
  } catch (e) {
    console.error('Failed to capture receipt', e)
  }
}

const _submit = async () => {
  if (!assetId.value || !quantity.value || !totalCost.value) {
    toast.add({
      title: 'Missing Information',
      description: 'Please fill in required fields.',
      color: 'warning'
    })
    return
  }

  try {
    await recordTransaction({
      assetId: assetId.value,
      quantity: parseFloat(quantity.value),
      totalCost: parseFloat(totalCost.value),
      odometer: odometer.value ? parseFloat(odometer.value) : undefined,
      fuelType: fuelType.value,
      stationName: stationName.value,
      receiptImage: receiptImage.value,
      transactionDate: new Date().toISOString()
    })

    toast.add({ title: 'Transaction Recorded', color: 'success' })

    // Reset form
    quantity.value = ''
    totalCost.value = ''
    odometer.value = ''
    receiptImage.value = ''
  } catch (error: unknown) {
    toast.add({
      title: 'Failed to record fuel',
      description: (error as Error).message,
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="p-4 space-y-6 pb-20">
    <div class="text-center">
      <h2 class="text-xl font-bold">
        Fuel Logger
      </h2>
      <p class="text-dimmed">
        Record vehicle refueling details.
      </p>
    </div>

    <UCard>
      <div class="space-y-4">
        <UFormField label="Vehicle Identification">
          <div class="space-y-2">
            <UInput v-model="assetId" placeholder="Scan or enter Asset ID" />
            <div class="grid grid-cols-2 gap-2">
              <UButton
                size="sm"
                icon="i-lucide-nfc"
                label="NFC Scan"
                variant="soft"
                :loading="nfcScanning"
                @click="onScan('nfc')"
              />
              <UButton
                size="sm"
                icon="i-lucide-qr-code"
                label="QR Scan"
                variant="soft"
                :loading="qrScanning"
                @click="onScan('qr')"
              />
            </div>
          </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Quantity (Liters)" required>
            <UInput
              v-model="quantity"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </UFormField>
          <UFormField label="Total Cost" required>
            <UInput
              v-model="totalCost"
              type="number"
              step="0.01"
              placeholder="0.00"
              icon="i-lucide-dollar-sign"
            />
          </UFormField>
        </div>

        <UFormField label="Current Odometer">
          <UInput v-model="odometer" type="number" placeholder="Optional" />
        </UFormField>

        <UFormField label="Fuel Type">
          <USelect v-model="fuelType" :options="fuelTypes" />
        </UFormField>

        <UFormField label="Station Name">
          <UInput v-model="stationName" placeholder="e.g. Shell Main St" />
        </UFormField>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Receipt Photo</label>
          <div v-if="receiptImage" class="relative rounded-lg overflow-hidden border border-default aspect-video">
            <img :src="receiptImage" class="object-cover w-full h-full">
            <UButton
              icon="i-lucide-camera"
              class="absolute bottom-2 right-2"
              size="xs"
              @click="onCaptureReceipt"
            >
              Retake
            </UButton>
          </div>
          <UButton
            v-else
            icon="i-lucide-camera"
            label="Capture Receipt"
            block
            variant="outline"
            @click="onCaptureReceipt"
          />
        </div>
      </div>

      <template #footer>
        <UButton
          label="Record Fuel Transaction"
          size="xl"
          block
          :loading="loading"
          @click="submit"
        />
      </template>
    </UCard>
  </div>
</template>
