<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const {
  data: wo,
  pending,
  refresh: refreshWo
} = await useFetch<Record<string, unknown>>(`/api/work-orders/${id}`)
const { data: woParts, refresh: refreshParts } = await useFetch<Record<string, unknown>[]>(
  `/api/work-orders/${id}/parts`
)
const { parts: allParts, fetchParts, locations, fetchLocations } = useInventory()

const checklist = ref<Record<string, unknown>[]>([])

watch(
  wo,
  (newWo) => {
    if (newWo?.checklist) {
      checklist.value = JSON.parse(JSON.stringify(newWo.checklist))
    }
  },
  { immediate: true }
)

const isAddPartModalOpen = ref(false)
const isCompleteModalOpen = ref(false)
const selectedPartId = ref('')
const partQuantity = ref(1)
const selectedLocationId = ref('')

await Promise.all([fetchParts(), fetchLocations()])

async function _onAddPart() {
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
  } catch (error: unknown) {
    toast.add({ title: 'Error adding part', description: (error as Error).message, color: 'error' })
  }
}

async function _onRemovePart(woPartId: string) {
  try {
    await $fetch(`/api/work-orders/parts/${woPartId}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Part removed', color: 'success' })
    await Promise.all([refreshWo(), refreshParts()])
  } catch (error: unknown) {
    toast.add({
      title: 'Error removing part',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

const completionMileage = ref('')
const completionHours = ref('')
const laborCost = ref('0')

async function _onComplete() {
  if (!selectedLocationId.value) {
    toast.add({ title: 'Please select a location', color: 'error' })
    return
  }
  try {
    await $fetch(`/api/work-orders/${id}/complete`, {
      method: 'POST',
      body: {
        locationId: selectedLocationId.value,
        checklist: checklist.value,
        completionMileage: completionMileage.value,
        completionHours: completionHours.value,
        laborCost: laborCost.value
      }
    })
    toast.add({ title: 'Work Order completed', color: 'success' })
    isCompleteModalOpen.value = false
    await refreshWo()
  } catch (error: unknown) {
    toast.add({
      title: 'Error completing work order',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

const _updateChecklistStatus = (index: number, status: string) => {
  if (wo.value?.status === 'completed') return
  if (checklist.value[index]) {
    checklist.value[index].status = status
  }
}

const _items = [
  { label: 'Details', slot: 'details' },
  { label: 'Checklist', slot: 'checklist' },
  { label: 'Parts', slot: 'parts' },
  { label: 'Forms', slot: 'forms' },
  { label: 'Photos', slot: 'photos', disabled: true },
  { label: 'Time & Cost', slot: 'cost', disabled: true },
  { label: 'History', slot: 'history', disabled: true }
]

const _getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'primary'
    case 'in_progress':
      return 'info'
    case 'pending_parts':
      return 'warning'
    case 'completed':
      return 'success'
    case 'closed':
      return 'neutral'
    default:
      return 'neutral'
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
          <h1 class="text-3xl font-bold">
            {{ wo.woNumber }}
          </h1>
          <p class="text-gray-500">
            {{ wo.description }}
          </p>
        </div>
        <div class="flex gap-2">
          <UBadge :color="getStatusColor(wo.status as string)" size="lg">
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
          <UButton icon="i-heroicons-pencil-square" color="neutral" variant="ghost">
            Edit
          </UButton>
        </div>
      </div>

      <UTabs :items="items" class="w-full">
        <template #details>
          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">
                Work Order Details
              </h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Asset</label>
                  <p class="font-medium">
                    {{ (wo as any).assetNumber }} - {{ (wo as any).assetMake }} {{ (wo as any).assetModel }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Priority</label>
                  <p class="capitalize">
                    {{ wo.priority }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Due Date</label>
                  <p>{{ wo.dueDate || '-' }}</p>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Created</label>
                  <p>{{ new Date(wo.createdAt as string).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <template #checklist>
          <UCard class="mt-4">
            <div v-if="!checklist || checklist.length === 0" class="text-center p-8 text-gray-500">
              No checklist items for this work order.
            </div>
            <div v-else class="space-y-6">
              <div v-for="(item, index) in checklist" :key="index" class="border-b border-default pb-4">
                <p class="font-medium mb-2">
                  {{ item.label }}
                </p>
                <div class="flex gap-2">
                  <UButton
                    label="Pass"
                    :color="item.status === 'passed' ? 'success' : 'neutral'"
                    variant="soft"
                    class="flex-1"
                    :disabled="wo?.status === 'completed'"
                    @click="updateChecklistStatus(index, 'passed')"
                  />
                  <UButton
                    label="Fail"
                    :color="item.status === 'failed' ? 'error' : 'neutral'"
                    variant="soft"
                    class="flex-1"
                    :disabled="wo?.status === 'completed'"
                    @click="updateChecklistStatus(index, 'failed')"
                  />
                  <UButton
                    label="N/A"
                    :color="item.status === 'na' ? 'primary' : 'neutral'"
                    variant="soft"
                    class="flex-1"
                    :disabled="wo?.status === 'completed'"
                    @click="updateChecklistStatus(index, 'na')"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <template #forms>
          <div class="mt-4 max-w-2xl">
            <FormsContextForms module="work_orders" :context="{ id, assetId: wo.assetId as string }" />
          </div>
        </template>

        <template #parts>
          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                  Parts Used
                </h3>
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
                  @click="onRemovePart((row as any).id as string)"
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
            <h3 class="text-base font-semibold">
              Add Part to Work Order
            </h3>
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
              <UButton color="neutral" variant="ghost" @click="isAddPartModalOpen = false">
                Cancel
              </UButton>
              <UButton color="primary" @click="onAddPart">
                Add Part
              </UButton>
            </div>
          </div>
        </UCard>
      </UModal>

      <UModal v-model="isCompleteModalOpen">
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">
              Complete Work Order
            </h3>
          </template>
          <div class="space-y-4">
            <p>Please provide final details for completion:</p>
            <UFormGroup label="Inventory Location (Parts Origin)">
              <USelect
                v-model="selectedLocationId"
                :options="locations.map(l => ({ label: l.name, value: l.id }))"
                placeholder="Select location..."
              />
            </UFormGroup>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Final Mileage">
                <UInput v-model="completionMileage" type="number" placeholder="0.00" />
              </UFormGroup>
              <UFormGroup label="Final Hours">
                <UInput v-model="completionHours" type="number" placeholder="0.00" />
              </UFormGroup>
            </div>
            <UFormGroup label="Labor Cost ($)">
              <UInput v-model="laborCost" type="number" step="0.01" />
            </UFormGroup>
            <div class="flex justify-end gap-3 pt-4">
              <UButton color="neutral" variant="ghost" @click="isCompleteModalOpen = false">
                Cancel
              </UButton>
              <UButton color="success" @click="onComplete">
                Complete Work Order
              </UButton>
            </div>
          </div>
        </UCard>
      </UModal>
    </div>
    <div v-else class="text-center p-8">
      <p class="text-red-500">
        Work Order not found
      </p>
      <UButton
        to="/work-orders"
        color="neutral"
        variant="ghost"
        class="mt-4"
      >
        Back to List
      </UButton>
    </div>
  </div>
</template>
