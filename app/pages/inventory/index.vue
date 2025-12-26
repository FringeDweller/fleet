<script setup lang="ts">
import type { Part } from '~/types'

const columns: any[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Name' },
  { key: 'categoryName', label: 'Category' },
  { key: 'quantityOnHand', label: 'On Hand' },
  { key: 'unit', label: 'Unit' },
  { key: 'unitCost', label: 'Unit Cost' },
  { key: 'actions' }
]

const search = ref('')
const selectedCategory = ref('')
const showLowStockOnly = ref(false)
const page = ref(1)
const pageCount = 10

const { data: inventory, pending } = await useFetch('/api/inventory/parts', {
  query: {
    q: search,
    categoryId: selectedCategory,
    lowStock: showLowStockOnly,
    page: page,
    limit: pageCount
  }
})

const { data: categories } = await useFetch('/api/inventory/categories')

const categoryOptions = computed(() => {
  const options = [{ label: 'All Categories', value: '' }]
  if (categories.value) {
    options.push(...(categories.value as any[]).map(c => ({ label: c.name, value: c.id })))
  }
  return options
})

const formatCurrency = (value: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Inventory">
        <template #right>
          <UButton
            to="/inventory/count"
            icon="i-heroicons-clipboard-document-check"
            color="neutral"
            variant="ghost"
            class="mr-2"
          >
            Inventory Count
          </UButton>
          <UButton to="/inventory/new" icon="i-heroicons-plus" color="primary">
            New Part
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search parts..."
            class="w-64"
          />
          <USelect
            v-model="selectedCategory"
            :options="categoryOptions"
            class="w-48"
          />
          <UCheckbox
            v-model="showLowStockOnly"
            label="Low Stock Only"
          />
        </template>
      </UDashboardToolbar>

      <UTable
        :rows="inventory?.items || []"
        :columns="columns"
        :loading="pending"
      >
        <template #unitCost-data="{ row }">
          {{ formatCurrency((row as any).unitCost) }}
        </template>
        <template #quantityOnHand-data="{ row }">
          <span :class="{ 'text-error-500 font-bold': Number((row as any).quantityOnHand) <= Number((row as any).reorderThreshold) }">
            {{ (row as any).quantityOnHand }}
          </span>
        </template>
        <template #actions-data="{ row }">
          <UButton
            :to="`/inventory/${(row as any).id}`"
            icon="i-heroicons-pencil-square"
            size="xs"
            color="neutral"
            variant="ghost"
          />
        </template>
      </UTable>

      <div class="flex justify-end p-4 border-t border-default">
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="inventory?.total || 0"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
