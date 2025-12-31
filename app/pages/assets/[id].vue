<script setup lang="ts">
import type { Asset, Part } from '~/types'

const route = useRoute()
const assetId = route.params.id as string
const toast = useToast()

const { data: asset, status, refresh } = await useFetch<Asset>(`/api/assets/${assetId}`)
const { data: compatibleParts, status: partsStatus } = await useFetch<Part[]>(
  `/api/inventory/compatibility/asset/${assetId}`
)

const pending = computed(() => status.value === 'pending')
const loadingParts = computed(() => partsStatus.value === 'pending')

const isEditOpen = ref(false)
const editLoading = ref(false)
const isDeleteConfirmOpen = ref(false)
const deleteLoading = ref(false)

async function handleEditSubmit(data: Partial<Asset>) {
  editLoading.value = true
  try {
    await $fetch(`/api/assets/${assetId}`, {
      method: 'PUT',
      body: data
    })
    toast.add({
      title: 'Success',
      description: 'Asset updated successfully',
      color: 'success'
    })
    isEditOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update asset',
      color: 'error'
    })
  } finally {
    editLoading.value = false
  }
}

async function handleDelete() {
  deleteLoading.value = true
  try {
    await $fetch(`/api/assets/${assetId}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Success',
      description: 'Asset deleted successfully',
      color: 'success'
    })
    await navigateTo('/assets')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to delete asset',
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
    isDeleteConfirmOpen.value = false
  }
}

const items = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Work Orders', slot: 'work-orders', disabled: true },
  { label: 'Maintenance', slot: 'maintenance', disabled: true },
  { label: 'Parts', slot: 'parts' },
  { label: 'Inspections', slot: 'inspections', disabled: true },
  { label: 'Fuel', slot: 'fuel' },
  { label: 'Forms', slot: 'forms' },
  { label: 'Documents', slot: 'documents' },
  { label: 'Location', slot: 'location', disabled: true },
  { label: 'Operators', slot: 'operators', disabled: true }
]
</script>

<template>
  <div class="p-4">
    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-lucide-refresh-cw" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="asset">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-highlighted">
            {{ asset.assetNumber }}
          </h1>
          <p class="text-dimmed">
            {{ asset.year }} {{ asset.make }} {{ asset.model }}
          </p>
        </div>
        <div class="flex gap-2">
          <UBadge :color="asset.status === 'active' ? 'success' : 'neutral'" size="lg">
            {{ asset.status }}
          </UBadge>
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" @click="isEditOpen = true">
            Edit
          </UButton>
          <UButton icon="i-lucide-trash" color="error" variant="ghost" @click="isDeleteConfirmOpen = true">
            Delete
          </UButton>
        </div>
      </div>

      <UModal v-model:open="isEditOpen" title="Edit Asset">
        <template #body>
          <AssetsAssetForm
            :initial-values="asset"
            :loading="editLoading"
            @submit="handleEditSubmit"
            @cancel="isEditOpen = false"
          />
        </template>
      </UModal>

      <UModal v-model:open="isDeleteConfirmOpen" title="Delete Asset">
        <template #body>
          <div class="space-y-4">
            <p>Are you sure you want to delete asset <strong>{{ asset.assetNumber }}</strong>? This action cannot be undone.</p>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="isDeleteConfirmOpen = false">
                Cancel
              </UButton>
              <UButton color="error" :loading="deleteLoading" @click="handleDelete">
                Delete Asset
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <UTabs :items="items" class="w-full">
        <template #overview>
          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">
                Asset Details
              </h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-dimmed">VIN</label>
                  <p class="text-highlighted">{{ asset.vin || '-' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-dimmed">License Plate</label>
                  <p class="text-highlighted">{{ asset.licensePlate || '-' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-dimmed">Category</label>
                  <p class="text-highlighted">{{ asset.categoryName || '-' }}</p>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-dimmed">Current Mileage</label>
                  <p class="text-highlighted">{{ asset.currentMileage }} km</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-dimmed">Current Hours</label>
                  <p class="text-highlighted">{{ asset.currentHours }} hrs</p>
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <template #parts>
          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                  Compatible Parts
                </h3>
                <UButton
                  icon="i-lucide-plus"
                  size="xs"
                  color="primary"
                  label="Link Part"
                  disabled
                />
              </div>
            </template>

            <UTable
              :data="compatibleParts || []"
              :columns="[
                { accessorKey: 'sku', header: 'SKU' },
                { accessorKey: 'name', header: 'Name' },
                { accessorKey: 'categoryName', header: 'Category' },
                { accessorKey: 'quantityOnHand', header: 'On Hand' },
                { accessorKey: 'actions', header: '' }
              ]"
              :loading="loadingParts"
            >
              <template #actions-cell="{ row }">
                <UButton
                  :to="`/inventory/${row.original.id}`"
                  icon="i-lucide-eye"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                />
              </template>
            </UTable>
          </UCard>
        </template>

        <template #fuel>
          <AssetsFuelAnalytics :asset-id="assetId" />
        </template>

        <template #forms>
          <div class="mt-4 max-w-2xl">
            <FormsContextForms module="assets" :context="{ id: assetId, categoryId: asset.categoryId }" />
          </div>
        </template>

        <template #documents>
          <UCard class="mt-4">
            <EntityDocuments entity-type="asset" :entity-id="assetId" />
          </UCard>
        </template>

        <template #work-orders>
          <div class="p-4 text-center text-gray-500">
            Work Orders module coming soon
          </div>
        </template>
      </UTabs>
    </div>
    <div v-else class="text-center p-8">
      <p class="text-red-500">
        Asset not found
      </p>
      <UButton
        to="/assets"
        color="neutral"
        variant="ghost"
        class="mt-4"
      >
        Back to Assets
      </UButton>
    </div>
  </div>
</template>
