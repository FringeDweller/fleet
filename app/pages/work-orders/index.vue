<script setup lang="ts">
const columns = [
  { accessorKey: 'woNumber', header: 'WO #' },
  { accessorKey: 'assetNumber', header: 'Asset' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'dueDate', header: 'Due Date' },
  { accessorKey: 'actions', header: '' }
]

const search = ref('')
const selectedStatus = ref('')
const page = ref(1)
const pageCount = 10

const { data: workOrders, status: loadStatus } = await useFetch<{
  items: Record<string, unknown>[]
  total: number
}>('/api/work-orders', {
  query: {
    q: search,
    status: selectedStatus,
    page: page,
    limit: pageCount
  }
})

const pending = computed(() => loadStatus.value === 'pending')

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending Parts', value: 'pending_parts' },
  { label: 'Completed', value: 'completed' },
  { label: 'Closed', value: 'closed' }
]

const getStatusColor = (status: string) => {
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
      return 'neutral'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-highlighted">
        Work Orders
      </h1>
      <UButton to="/work-orders/new" icon="i-lucide-plus" color="primary">
        New Work Order
      </UButton>
    </div>

    <div class="flex gap-4 mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search work orders..."
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
      :data="workOrders?.items || []"
      :columns="columns"
      :loading="pending"
    >
      <template #status-cell="{ row }">
        <UBadge :color="getStatusColor(row.original.status as string)" variant="subtle" class="capitalize">
          {{ row.original.status }}
        </UBadge>
      </template>
      <template #priority-cell="{ row }">
        <UBadge :color="getPriorityColor(row.original.priority as string)" variant="subtle" size="xs" class="capitalize">
          {{ row.original.priority }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          :to="`/work-orders/${row.original.id}`"
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
        :total="workOrders?.total || 0"
      />
    </div>
  </div>
</template>
