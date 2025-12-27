<script setup lang="ts">
const { data: _inspections, pending: _pending } =
  await useFetch<Record<string, unknown>[]>('/api/inspections')

const _columns = [
  { key: 'createdAt', label: 'Date' },
  { key: 'assetNumber', label: 'Vehicle' },
  { key: 'operatorName', label: 'Operator' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' }
]

const _getStatusColor = (status: string) => {
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
      <h1 class="text-2xl font-bold">
        Inspection History
      </h1>
    </div>

    <UCard>
      <UTable
        :rows="inspections || []"
        :columns="columns as any[]"
        :loading="pending"
      >
        <template #createdAt-data="{ row }">
          {{ new Date((row as any).createdAt).toLocaleString() }}
        </template>
        <template #status-data="{ row }">
          <UBadge :color="getStatusColor((row as any).status)" variant="subtle" class="capitalize">
            {{ (row as any).status }}
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            :to="`/inspections/${(row as any).id}`"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>
