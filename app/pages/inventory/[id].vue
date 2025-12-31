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
const part = ref<any>(null)
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

async function onRecordMovement() {
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
const isDeleteConfirmOpen = ref(false)
const deleteLoading = ref(false)

async function onDelete() {
  deleteLoading.value = true
  try {
    await $fetch(`/api/inventory/parts/${partId}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Part deleted',
      color: 'success'
    })
    await navigateTo('/inventory')
  } catch (error: unknown) {
    toast.add({
      title: 'Error deleting part',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
    isDeleteConfirmOpen.value = false
  }
}

async function onUpdate() {
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

const historyColumns = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'quantity', header: 'Quantity' },
  { accessorKey: 'locationName', header: 'Location' },
  { accessorKey: 'userName', header: 'User' },
  { accessorKey: 'reason', header: 'Reason' }
]

const formatCurrency = (value: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  )
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<template>
  <UDashboardPanel grow id="part-detail">
    <template #header>
      <UDashboardNavbar :title="part?.name || 'Part Details'">
        <template #leading>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inventory"
          />
        </template>
        <template #right>
          <div class="flex gap-2">
            <UButton
              label="Record Movement"
              icon="i-heroicons-arrows-right-left"
              color="primary"
              @click="isMovementModalOpen = true"
            />
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              @click="isDeleteConfirmOpen = true"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-8 overflow-y-auto">
        <UModal v-model:open="isDeleteConfirmOpen" title="Delete Part">
          <template #body>
            <div class="space-y-4">
              <p>Are you sure you want to delete part <strong>{{ part?.name }}</strong>? This action cannot be undone.</p>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" @click="isDeleteConfirmOpen = false">
                  Cancel
                </UButton>
                <UButton color="error" :loading="deleteLoading" @click="onDelete">
                  Delete Part
                </UButton>
              </div>
            </div>
          </template>
        </UModal>

        <UModal v-model:open="isMovementModalOpen" title="Record Stock Movement">
          <template #body>
            <div class="space-y-4">
              <UFormField label="Type" name="type">
                <USelect
                  v-model="movementState.type"
                  :items="[{ label: 'Stock In', value: 'in' }, { label: 'Stock Out', value: 'out' }, { label: 'Adjustment (Absolute)', value: 'adjustment' }, { label: 'Transfer', value: 'transfer' }]"
                  label-key="label"
                  value-key="value"
                />
              </UFormField>

              <UFormField :label="movementState.type === 'transfer' ? 'From Location' : 'Location'" name="locationId" required>
                <USelect
                  v-model="movementState.locationId"
                  :items="locations"
                  label-key="name"
                  value-key="id"
                  placeholder="Select location"
                />
              </UFormField>

              <UFormField
                v-if="movementState.type === 'transfer'"
                label="To Location"
                name="toLocationId"
                required
              >
                <USelect
                  v-model="movementState.toLocationId"
                  :items="locations"
                  label-key="name"
                  value-key="id"
                  placeholder="Select destination"
                />
              </UFormField>

              <UFormField label="Quantity" name="quantity" required>
                <UInput v-model="movementState.quantity" type="number" step="0.01" />
              </UFormField>

              <UFormField label="Reason" name="reason">
                <UInput v-model="movementState.reason" placeholder="e.g. Received shipment, Used for repairs" />
              </UFormField>

              <div class="flex justify-end gap-3">
                <UButton color="neutral" variant="ghost" @click="isMovementModalOpen = false">
                  Cancel
                </UButton>
                <UButton color="primary" :loading="recordingMovement" @click="onRecordMovement">
                  Record
                </UButton>
              </div>
            </div>
          </template>
        </UModal>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- General Info & Edit Form -->
          <section>
            <h2 class="text-lg font-semibold mb-4">
              Edit Part Information
            </h2>
            <form class="space-y-4" @submit.prevent="onUpdate">
              <UFormField label="SKU" name="sku" required>
                <UInput v-model="editState.sku" />
              </UFormField>

              <UFormField label="Name" name="name" required>
                <UInput v-model="editState.name" />
              </UFormField>

              <UFormField label="Description" name="description">
                <UTextarea v-model="editState.description" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Unit" name="unit" required>
                  <UInput v-model="editState.unit" />
                </UFormField>

                <UFormField label="Category" name="categoryId">
                  <USelect
                    v-model="editState.categoryId"
                    :items="categories.map(c => ({ ...c, description: c.description || undefined }))"
                    label-key="name"
                    value-key="id"
                    placeholder="Select category"
                  />
                </UFormField>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <UFormField label="Unit Cost" name="unitCost">
                  <UInput v-model="editState.unitCost" type="number" step="0.01" />
                </UFormField>

                <UFormField label="Reorder Threshold" name="reorderThreshold">
                  <UInput v-model="editState.reorderThreshold" type="number" step="0.01" />
                </UFormField>

                <UFormField label="Reorder Quantity" name="reorderQuantity">
                  <UInput v-model="editState.reorderQuantity" type="number" step="0.01" />
                </UFormField>
              </div>

              <div class="flex justify-end mt-4">
                <UButton type="submit" color="primary" :loading="updating">
                  Update Part
                </UButton>
              </div>
            </form>
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
          <h2 class="text-lg font-semibold mb-4 text-highlighted">
            Usage & Movement History
          </h2>
          <UTable
            :data="part?.history || []"
            :columns="historyColumns"
          >
            <template #createdAt-cell="{ row }">
              {{ formatDate(row.original.createdAt as string) }}
            </template>
            <template #type-cell="{ row }">
              <UBadge :color="row.original.type === 'in' ? 'success' : (row.original.type === 'out' ? 'error' : (row.original.type === 'transfer' ? 'info' : 'neutral'))">
                {{ (row.original.type as string).toUpperCase() }}
              </UBadge>
            </template>
          </UTable>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
