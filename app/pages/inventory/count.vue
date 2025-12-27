<script setup lang="ts">
import type { Part } from '~/types'

const { categories, fetchCategories, recordMovement } = useInventory()
const toast = useToast()
const router = useRouter()

const selectedCategoryId = ref('')
const partsToCount = ref<(Part & { physicalCount: string })[]>([])
const loading = ref(false)

await fetchCategories()

async function onCategoryChange() {
  if (!selectedCategoryId.value) {
    partsToCount.value = []
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{ items: Part[] }>('/api/inventory/parts', {
      query: { categoryId: selectedCategoryId.value, limit: 100 }
    })
    partsToCount.value = response.items.map((p) => ({ ...p, physicalCount: p.quantityOnHand }))
  } finally {
    loading.value = false
  }
}

const adjusting = ref(false)

async function onAdjust() {
  adjusting.value = true
  try {
    for (const part of partsToCount.value) {
      if (part.physicalCount !== part.quantityOnHand) {
        await recordMovement({
          partId: part.id,
          type: 'adjustment',
          quantity: part.physicalCount,
          reason: 'Inventory Count Reconciliation'
        })
      }
    }
    toast.add({
      title: 'Inventory adjusted',
      color: 'success'
    })
    router.push('/inventory')
  } catch (error: unknown) {
    toast.add({
      title: 'Error adjusting inventory',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    adjusting.value = false
  }
}

const columns = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Part' },
  { accessorKey: 'quantityOnHand', header: 'System Qty' },
  { accessorKey: 'physicalCount', header: 'Physical Qty' },
  { accessorKey: 'variance', header: 'Variance' }
]
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Inventory Count">
        <template #left>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inventory"
          />
        </template>
      </UDashboardNavbar>

      <div class="p-4 space-y-6">
        <UFormGroup label="Select Category to Count">
          <USelect
            v-model="selectedCategoryId"
            :options="categories.map(c => ({ label: c.name, value: c.id }))"
            placeholder="Choose category..."
            @change="onCategoryChange"
          />
        </UFormGroup>

        <div v-if="loading" class="flex justify-center p-8">
          <UIcon name="i-lucide-refresh-cw" class="animate-spin text-2xl" />
        </div>

        <div v-else-if="partsToCount.length" class="space-y-4">
          <UTable
            :data="partsToCount"
            :columns="columns"
          >
            <template #physicalCount-cell="{ row }">
              <UInput
                v-model="row.original.physicalCount"
                type="number"
                step="0.01"
                class="w-32"
              />
            </template>
            <template #variance-cell="{ row }">
              <span :class="{ 'text-error-500 font-bold': Number(row.original.physicalCount) !== Number(row.original.quantityOnHand) }">
                {{ Number(row.original.physicalCount) - Number(row.original.quantityOnHand) }}
              </span>
            </template>
          </UTable>

          <div class="flex justify-end gap-4">
            <UButton color="neutral" variant="ghost" to="/inventory">
              Cancel
            </UButton>
            <UButton color="primary" :loading="adjusting" @click="onAdjust">
              Adjust All
            </UButton>
          </div>
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
