<script setup lang="ts">
const columns: any[] = [
  { key: 'woNumber', label: 'WO #' },
  { key: 'assetNumber', label: 'Asset' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'actions' }
]

const search = ref('')
const selectedStatus = ref('')
const page = ref(1)
const pageCount = 10

const { data: workOrders, pending } = await useFetch('/api/work-orders', {
  query: {
    q: search,
    status: selectedStatus,
    page: page,
    limit: pageCount
  }
})

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
    case 'open': return 'primary'
    case 'in_progress': return 'info'
    case 'pending_parts': return 'warning'
    case 'completed': return 'success'
    case 'closed': return 'neutral'
    default: return 'neutral'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'neutral'
    default: return 'neutral'
  }
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">
        Work Orders
      </h1>
      <UButton to="/work-orders/new" icon="i-heroicons-plus" color="primary">
        New Work Order
      </UButton>
    </div>

    <div class="flex gap-4 mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
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
      :rows="workOrders?.items || []"
      :columns="columns"
      :loading="pending"
    >
      <template #status-data="{ row }">
        <UBadge :color="getStatusColor((row as any).status)">
          {{ (row as any).status }}
        </UBadge>
      </template>
      <template #priority-data="{ row }">
        <UBadge :color="getPriorityColor((row as any).priority)" variant="subtle" size="xs">
          {{ (row as any).priority }}
        </UBadge>
      </template>
      <template #actions-data="{ row }">
        <UButton
          :to="`/work-orders/${(row as any).id}`"
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
        :total="workOrders?.total || 0"
      />
    </div>
  </div>
</template>
