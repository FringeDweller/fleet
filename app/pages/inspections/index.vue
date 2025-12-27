<script setup lang="ts">
const { data: inspections, status } = await useFetch<Record<string, unknown>[]>('/api/inspections')

const pending = computed(() => status.value === 'pending')

const columns = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'assetNumber', header: 'Vehicle' },
  { accessorKey: 'operatorName', header: 'Operator' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed':
      return 'success'
    case 'failed':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <div class="p-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-highlighted">
        Inspection History
      </h1>
    </div>

    <UCard>
      <UTable
        :data="inspections || []"
        :columns="columns"
        :loading="pending"
      >
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt as string).toLocaleString() }}
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status as string)" variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            :to="`/inspections/${row.original.id}`"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>
