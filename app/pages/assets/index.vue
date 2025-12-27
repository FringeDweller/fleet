<script setup lang="ts">
import type { Asset } from '~/types'

const columns = [
  { accessorKey: 'assetNumber', header: 'Asset #' },
  { accessorKey: 'make', header: 'Make' },
  { accessorKey: 'model', header: 'Model' },
  { accessorKey: 'categoryName', header: 'Category' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' }
]

const search = ref('')
const selectedStatus = ref('')
const page = ref(1)
const pageCount = 10

const { data: assets, status } = await useFetch<{ items: Asset[]; total: number }>('/api/assets', {
  query: {
    q: search,
    status: selectedStatus,
    page,
    limit: pageCount
  }
})

const pending = computed(() => status.value === 'pending')

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Disposed', value: 'disposed' }
]
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-highlighted">
        Assets
      </h1>
      <UButton to="/assets/new" icon="i-lucide-plus" color="primary">
        New Asset
      </UButton>
    </div>

    <div class="flex gap-4 mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search assets..."
        class="w-64"
      />
      <USelect
        v-model="selectedStatus"
        :options="statusOptions"
        placeholder="Status"
        class="w-40"
      />
    </div>

    <UTable
      :data="assets?.items || []"
      :columns="columns"
      :loading="pending"
    >
      <template #status-cell="{ row }">
        <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'">
          {{ row.original.status }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          :to="`/assets/${row.original.id}`"
          icon="i-lucide-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UTable>

    <div class="flex justify-end mt-4">
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="assets?.total || 0"
      />
    </div>
  </div>
</template>
