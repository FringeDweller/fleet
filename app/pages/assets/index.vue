<script setup lang="ts">
const columns: any[] = [
  { key: 'assetNumber', label: 'Asset #' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'status', label: 'Status' },
  { key: 'actions' }
]

const search = ref('')
const selectedStatus = ref('')
const page = ref(1)
const pageCount = 10

const { data: assets, pending } = await useFetch('/api/assets', {
  query: {
    q: search,
    status: selectedStatus,
    page: page,
    limit: pageCount
  }
})

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
      <h1 class="text-2xl font-bold">
        Assets
      </h1>
      <UButton to="/assets/new" icon="i-heroicons-plus" color="primary">
        New Asset
      </UButton>
    </div>

    <div class="flex gap-4 mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
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
      :rows="assets?.items || []"
      :columns="columns"
      :loading="pending"
    >
      <template #status-data="{ row }">
        <UBadge :color="(row as any).status === 'active' ? 'success' : 'neutral'">
          {{ (row as any).status }}
        </UBadge>
      </template>
      <template #actions-data="{ row }">
        <UButton
          :to="`/assets/${(row as any).id}`"
          icon="i-heroicons-pencil-square"
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
