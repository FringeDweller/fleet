<script setup lang="ts">
import type { Part } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const {
  fetchPart,
  updatePart,
  categories,
  fetchCategories,
  recordMovement,
  locations,
  fetchLocations
} = useInventory()

const partId = route.params.id as string
const loading = ref(true)
const part = ref<Part | null>(null)
const isMovementModalOpen = ref(false)

const movementState = reactive({
  type: 'in' as 'in' | 'out' | 'adjustment' | 'transfer',
  quantity: '1',
  reason: '',
  locationId: '',
  toLocationId: '',
  referenceType: 'manual' as 'manual' | 'work_order' | 'purchase_order'
})

const recordingMovement = ref(false)

async function _onRecordMovement() {
  recordingMovement.value = true
  try {
    await recordMovement({
      partId,
      ...movementState
    })
    toast.add({
      title: 'Movement recorded',
      color: 'success'
    })
    isMovementModalOpen.value = false
    await loadPart()
  } catch (error: unknown) {
    toast.add({
      title: 'Error recording movement',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    recordingMovement.value = false
  }
}

await Promise.all([fetchCategories(), fetchLocations()])

async function loadPart() {
  loading.value = true
  try {
    part.value = await fetchPart(partId)
  } catch (error: unknown) {
    toast.add({
      title: 'Error loading part',
      description: (error as Error).message,
      color: 'error'
    })
    router.push('/inventory')
  } finally {
    loading.value = false
  }
}

await loadPart()

const editState = reactive({
  sku: part.value?.sku || '',
  name: part.value?.name || '',
  description: part.value?.description || '',
  unit: part.value?.unit || 'pcs',
  categoryId: part.value?.categoryId,
  reorderThreshold: part.value?.reorderThreshold || '0',
  reorderQuantity: part.value?.reorderQuantity || '0',
  unitCost: part.value?.unitCost || '0'
})

const updating = ref(false)

async function _onUpdate() {
  updating.value = true
  try {
    await updatePart(partId, editState)
    toast.add({
      title: 'Part updated',
      color: 'success'
    })
    await loadPart()
  } catch (error: unknown) {
    toast.add({
      title: 'Error updating part',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

const _historyColumns = [
  { key: 'createdAt', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'locationName', label: 'Location' },
  { key: 'userName', label: 'User' },
  { key: 'reason', label: 'Reason' }
]

const _formatCurrency = (value: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  )
}

const _formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar :title="part?.name || 'Part Details'">
        <template #left>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inventory"
          />
        </template>
        <template #right>
          <UButton
            label="Record Movement"
            icon="i-heroicons-arrows-right-left"
            color="primary"
            @click="isMovementModalOpen = true"
          />
        </template>
      </UDashboardNavbar>

      <div class="p-4 space-y-8 overflow-y-auto">
        <UModal v-model="isMovementModalOpen">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold leading-6">
                  Record Stock Movement
                </h3>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  class="-my-1"
                  @click="isMovementModalOpen = false"
                />
              </div>
            </template>

            <UForm :state="movementState" class="space-y-4" @submit="onRecordMovement">
              <UFormGroup label="Type" name="type">
                <USelect v-model="movementState.type" :options="[{ label: 'Stock In', value: 'in' }, { label: 'Stock Out', value: 'out' }, { label: 'Adjustment (Absolute)', value: 'adjustment' }, { label: 'Transfer', value: 'transfer' }]" />
              </UFormGroup>

              <UFormGroup :label="movementState.type === 'transfer' ? 'From Location' : 'Location'" name="locationId" required>
                <USelect
                  v-model="movementState.locationId"
                  :options="locations.map(l => ({ label: l.name, value: l.id }))"
                  placeholder="Select location"
                />
              </UFormGroup>

              <UFormGroup
                v-if="movementState.type === 'transfer'"
                label="To Location"
                name="toLocationId"
                required
              >
                <USelect
                  v-model="movementState.toLocationId"
                  :options="locations.map(l => ({ label: l.name, value: l.id }))"
                  placeholder="Select destination"
                />
              </UFormGroup>

              <UFormGroup label="Quantity" name="quantity" required>
                <UInput v-model="movementState.quantity" type="number" step="0.01" />
              </UFormGroup>

              <UFormGroup label="Reason" name="reason">
                <UInput v-model="movementState.reason" placeholder="e.g. Received shipment, Used for repairs" />
              </UFormGroup>

              <div class="flex justify-end gap-3">
                <UButton color="neutral" variant="ghost" @click="isMovementModalOpen = false">
                  Cancel
                </UButton>
                <UButton type="submit" color="primary" :loading="recordingMovement">
                  Record
                </UButton>
              </div>
            </UForm>
          </UCard>
        </UModal>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- General Info & Edit Form -->
          <section>
            <h2 class="text-lg font-semibold mb-4">
              Edit Part Information
            </h2>
            <UForm :state="editState" class="space-y-4" @submit="onUpdate">
              <UFormGroup label="SKU" name="sku" required>
                <UInput v-model="editState.sku" />
              </UFormGroup>

              <UFormGroup label="Name" name="name" required>
                <UInput v-model="editState.name" />
              </UFormGroup>

              <UFormGroup label="Description" name="description">
                <UTextarea v-model="editState.description" />
              </UFormGroup>

              <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Unit" name="unit" required>
                  <UInput v-model="editState.unit" />
                </UFormGroup>

                <UFormGroup label="Category" name="categoryId">
                  <USelect
                    v-model="editState.categoryId"
                    :options="categories.map(c => ({ label: c.name, value: c.id }))"
                    placeholder="Select category"
                  />
                </UFormGroup>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <UFormGroup label="Unit Cost" name="unitCost">
                  <UInput v-model="editState.unitCost" type="number" step="0.01" />
                </UFormGroup>

                <UFormGroup label="Reorder Threshold" name="reorderThreshold">
                  <UInput v-model="editState.reorderThreshold" type="number" step="0.01" />
                </UFormGroup>

                <UFormGroup label="Reorder Quantity" name="reorderQuantity">
                  <UInput v-model="editState.reorderQuantity" type="number" step="0.01" />
                </UFormGroup>
              </div>

              <div class="flex justify-end">
                <UButton type="submit" color="primary" :loading="updating">
                  Update Part
                </UButton>
              </div>
            </UForm>
          </section>

          <!-- Status & Stats -->
          <section class="space-y-6">
            <h2 class="text-lg font-semibold mb-4">
              Stock Status
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <UCard>
                <div class="text-sm text-neutral-500">
                  Total On Hand
                </div>
                <div class="text-3xl font-bold" :class="{ 'text-error-500': Number(part?.quantityOnHand) <= Number(part?.reorderThreshold) }">
                  {{ part?.quantityOnHand }} {{ part?.unit }}
                </div>
              </UCard>
              <UCard>
                <div class="text-sm text-neutral-500">
                  Unit Cost
                </div>
                <div class="text-3xl font-bold">
                  {{ formatCurrency(part?.unitCost || '0') }}
                </div>
              </UCard>
            </div>

            <UCard v-if="part?.inventoryLevels?.length">
              <template #header>
                <h3 class="text-sm font-semibold">
                  Stock by Location
                </h3>
              </template>
              <div class="divide-y divide-default">
                <div v-for="level in part?.inventoryLevels" :key="level.locationId" class="flex justify-between py-2 first:pt-0 last:pb-0">
                  <span class="text-sm">{{ level.locationName }}</span>
                  <span class="font-medium">{{ level.quantity }} {{ part?.unit }}</span>
                </div>
              </div>
            </UCard>

            <UAlert
              v-if="Number(part?.quantityOnHand) <= Number(part?.reorderThreshold)"
              icon="i-heroicons-exclamation-triangle"
              color="error"
              variant="soft"
              title="Low Stock Warning"
              :description="`Stock level is below the threshold of ${part?.reorderThreshold} ${part?.unit}.`"
            />
          </section>
        </div>

        <!-- Usage History -->
        <section>
          <h2 class="text-lg font-semibold mb-4">
            Usage & Movement History
          </h2>
          <UTable
            :rows="part?.history || []"
            :columns="historyColumns as any[]"
          >
            <template #createdAt-data="{ row }">
              {{ formatDate((row as any).createdAt) }}
            </template>
            <template #type-data="{ row }">
              <UBadge :color="(row as any).type === 'in' ? 'success' : (row as any).type === 'out' ? 'error' : (row as any).type === 'transfer' ? 'info' : 'neutral'">
                {{ (row as any).type.toUpperCase() }}
              </UBadge>
            </template>
          </UTable>
        </section>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
