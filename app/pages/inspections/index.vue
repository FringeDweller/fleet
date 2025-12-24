<script setup lang="ts">
const { data: inspections, pending } = await useFetch<any[]>('/api/inspections')

const columns = [
  { key: 'createdAt', label: 'Date' },
  { key: 'assetNumber', label: 'Vehicle' },
  { key: 'operatorName', label: 'Operator' },
  { key: 'status', label: 'Status' },
  { key: 'actions' }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed': return 'success'
    case 'failed': return 'error'
    case 'pending': return 'warning'
    default: return 'neutral'
  }
}
</script>

<template>
  <div class="p-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Inspection History</h1>
    </div>

    <UCard>
      <UTable
        :rows="inspections || []"
        :columns="columns"
        :loading="pending"
      >
        <template #createdAt-data="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)" variant="subtle" class="capitalize">
            {{ row.status }}
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            :to="`/inspections/${row.id}`"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>
