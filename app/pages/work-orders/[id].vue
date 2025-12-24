<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: wo, pending, refresh: refreshWo } = await useFetch(`/api/work-orders/${id}`)
const { data: woParts, refresh: refreshParts } = await useFetch(`/api/work-orders/${id}/parts`)
const { parts: allParts, fetchParts, locations, fetchLocations } = useInventory()

const isAddPartModalOpen = ref(false)
const isCompleteModalOpen = ref(false)
const selectedPartId = ref('')
const partQuantity = ref(1)
const selectedLocationId = ref('')

await Promise.all([fetchParts(), fetchLocations()])

async function onAddPart() {
  try {
    await $fetch(`/api/work-orders/${id}/parts`, {
      method: 'POST',
      body: {
        partId: selectedPartId.value,
        quantity: partQuantity.value.toString()
      }
    })
    toast.add({ title: 'Part added', color: 'success' })
    isAddPartModalOpen.value = false
    selectedPartId.value = ''
    partQuantity.value = 1
    await Promise.all([refreshWo(), refreshParts()])
  } catch (error: any) {
    toast.add({ title: 'Error adding part', description: error.message, color: 'error' })
  }
}

async function onRemovePart(woPartId: string) {
  try {
    await $fetch(`/api/work-orders/parts/${woPartId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Part removed', color: 'success' })
    await Promise.all([refreshWo(), refreshParts()])
  } catch (error: any) {
    toast.add({ title: 'Error removing part', description: error.message, color: 'error' })
  }
}

async function onComplete() {
  if (!selectedLocationId.value) {
    toast.add({ title: 'Please select a location', color: 'error' })
    return
  }
  try {
    await $fetch(`/api/work-orders/${id}/complete`, {
      method: 'POST',
      body: {
        locationId: selectedLocationId.value
      }
    })
    toast.add({ title: 'Work Order completed', color: 'success' })
    isCompleteModalOpen.value = false
    await refreshWo()
  } catch (error: any) {
    toast.add({ title: 'Error completing work order', description: error.message, color: 'error' })
  }
}

const items = [
  { label: 'Details', slot: 'details' },
  { label: 'Checklist', slot: 'checklist' },
  { label: 'Parts', slot: 'parts' },
  { label: 'Photos', slot: 'photos', disabled: true },
  { label: 'Time & Cost', slot: 'cost', disabled: true },
  { label: 'History', slot: 'history', disabled: true }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'primary'
    case 'in_progress': return 'info'
    case 'pending_parts': return 'warning'
    case 'completed': return 'success'
    case 'closed': return 'neutral'
    default: return 'neutral'
  }
}
</script>

<template>
  <div class="p-4">
    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="wo">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">{{ wo.woNumber }}</h1>
          <p class="text-gray-500">{{ wo.description }}</p>
        </div>
        <div class="flex gap-2">
          <UBadge :color="getStatusColor(wo.status)" size="lg">
            {{ wo.status }}
          </UBadge>
          <UButton
            v-if="wo.status !== 'completed'"
            icon="i-heroicons-check-circle"
            color="success"
            @click="isCompleteModalOpen = true"
          >
            Complete
          </UButton>
          <UButton icon="i-heroicons-pencil-square" color="neutral" variant="ghost">Edit</UButton>
        </div>
      </div>

      <UTabs :items="items" class="w-full">
        <template #details>
          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">Work Order Details</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Asset</label>
                  <p class="font-medium">{{ (wo as any).assetNumber }} - {{ (wo as any).assetMake }} {{ (wo as any).assetModel }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Priority</label>
                  <p class="capitalize">{{ wo.priority }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Due Date</label>
                  <p>{{ wo.dueDate || '-' }}</p>
                </div>
              </div>
              <div class="space-y-4">
                 <div>
                  <label class="block text-sm font-medium text-gray-500">Created</label>
                  <p>{{ new Date(wo.createdAt).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </template>
        
        <template #checklist>
          <UCard class="mt-4">
             <div class="text-gray-500">Checklist items will appear here</div>
             <pre class="text-xs mt-2 bg-gray-50 p-2 rounded">{{ wo.checklist }}</pre>
          </UCard>
        </template>

        <template #parts>
          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Parts Used</h3>
                <UButton
                  v-if="wo.status !== 'completed'"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  label="Add Part"
                  @click="isAddPartModalOpen = true"
                />
              </div>
            </template>

            <UTable
              :rows="woParts || []"
              :columns="[
                { key: 'partSku', label: 'SKU' },
                { key: 'partName', label: 'Part' },
                { key: 'quantity', label: 'Qty' },
                { key: 'unit', label: 'Unit' },
                { key: 'unitCost', label: 'Unit Cost' },
                { key: 'actions' }
              ] as any[]"
            >
              <template #unitCost-data="{ row }">
                ${{ (row as any).unitCost }}
              </template>
              <template #actions-data="{ row }">
                <UButton
                  v-if="wo.status !== 'completed'"
                  icon="i-heroicons-trash"
                  size="xs"
                  color="error"
                  variant="ghost"
                  @click="onRemovePart((row as any).id)"
                />
              </template>
            </UTable>

            <template #footer>
              <div class="text-right font-bold">
                Parts Total: ${{ wo.partsCost }}
              </div>
            </template>
          </UCard>
        </template>
      </UTabs>

      <UModal v-model="isAddPartModalOpen">
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Add Part to Work Order</h3>
          </template>
          <div class="space-y-4">
            <UFormGroup label="Part">
              <USelectMenu
                v-model="selectedPartId"
                :options="allParts"
                option-attribute="name"
                value-attribute="id"
                searchable
                placeholder="Select a part..."
              />
            </UFormGroup>
            <UFormGroup label="Quantity">
              <UInput v-model="partQuantity" type="number" step="0.01" />
            </UFormGroup>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="isAddPartModalOpen = false">Cancel</UButton>
              <UButton color="primary" @click="onAddPart">Add Part</UButton>
            </div>
          </div>
        </UCard>
      </UModal>

      <UModal v-model="isCompleteModalOpen">
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Complete Work Order</h3>
          </template>
          <div class="space-y-4">
            <p>Please select the location parts were taken from:</p>
            <UFormGroup label="Location">
              <USelect
                v-model="selectedLocationId"
                :options="locations.map(l => ({ label: l.name, value: l.id }))"
                placeholder="Select location..."
              />
            </UFormGroup>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="isCompleteModalOpen = false">Cancel</UButton>
              <UButton color="success" @click="onComplete">Complete Work Order</UButton>
            </div>
          </div>
        </UCard>
      </UModal>
    </div>
    <div v-else class="text-center p-8">
      <p class="text-red-500">Work Order not found</p>
      <UButton to="/work-orders" color="neutral" variant="ghost" class="mt-4">Back to List</UButton>
    </div>
  </div>
</template>
