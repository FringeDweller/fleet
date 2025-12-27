<script setup lang="ts">
const columns = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'categoryName', header: 'Category' },
  { accessorKey: 'quantityOnHand', header: 'On Hand' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'unitCost', header: 'Unit Cost' },
  { accessorKey: 'actions', header: '' }
]

const search = ref('')
const selectedCategory = ref('')
const showLowStockOnly = ref(false)
const page = ref(1)
const pageCount = 10

const { data: inventory, status } = await useFetch<{
  items: Record<string, unknown>[]
  total: number
}>('/api/inventory/parts', {
  query: {
    q: search,
    categoryId: selectedCategory,
    lowStock: showLowStockOnly,
    page: page,
    limit: pageCount
  }
})

const pending = computed(() => status.value === 'pending')

const { data: categories } = await useFetch<Record<string, unknown>[]>('/api/inventory/categories')

const categoryOptions = computed(() => {
  const options = [{ label: 'All Categories', value: '' }]
  if (categories.value) {
    options.push(
      ...categories.value.map((c) => ({ label: c.name as string, value: c.id as string }))
    )
  }
  return options
})

const formatCurrency = (value: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  )
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Inventory">
        <template #right>
          <UButton
            to="/inventory/count"
            icon="i-lucide-check-square"
            color="neutral"
            variant="ghost"
            class="mr-2"
          >
            Inventory Count
          </UButton>
          <UButton to="/inventory/new" icon="i-lucide-plus" color="primary">
            New Part
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
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
        :data="inventory?.items || []"
        :columns="columns"
        :loading="pending"
      >
        <template #unitCost-cell="{ row }">
          {{ formatCurrency(row.original.unitCost as string) }}
        </template>
        <template #quantityOnHand-cell="{ row }">
          <span :class="{ 'text-error-500 font-bold': Number(row.original.quantityOnHand) <= Number(row.original.reorderThreshold) }">
            {{ row.original.quantityOnHand }}
          </span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            :to="`/inventory/${row.original.id}`"
            icon="i-lucide-pencil"
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
