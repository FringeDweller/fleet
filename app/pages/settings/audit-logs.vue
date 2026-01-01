<script setup lang="ts">
const { data: logs, refresh } = await useFetch<any[]>('/api/settings/audit-logs')

const columns = [
  { accessorKey: 'createdAt', header: 'Time' },
  { accessorKey: 'user', header: 'User' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Entity' },
  { accessorKey: 'details', header: 'Details' }
]

function exportLogs() {
  if (!logs.value) return
  // const data = logs.value.map((l: any) => ({
  //   ...l,
  //   user: l.user?.name || 'System',
  //   details: JSON.stringify(l.details)
  // }))
  // exportToCSV(data, columns, `audit-logs-${new Date().toISOString().split('T')[0]}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">Audit Log</h2>
        <p class="text-gray-500">Track all modifications and security events in your organisation.</p>
      </div>
      <UButton
        icon="i-lucide-download"
        label="Export CSV"
        variant="soft"
        color="neutral"
        @click="exportLogs"
      />
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :data="logs || []"
        :columns="columns"
      >
        <template #createdAt-cell="{ row }">
          <div class="text-xs text-dimmed">
            {{ new Date(row.original.createdAt).toLocaleString() }}
          </div>
        </template>

        <template #user-cell="{ row }">
          <div class="text-sm font-medium text-highlighted">
            {{ row.original.user?.name || 'System' }}
          </div>
        </template>

        <template #action-cell="{ row }">
          <UBadge
            :color="row.original.action === 'delete' ? 'error' : (row.original.action === 'create' ? 'success' : 'primary')"
            variant="subtle"
            size="xs"
            class="capitalize"
          >
            {{ row.original.action }}
          </UBadge>
        </template>

        <template #details-cell="{ row }">
          <div class="text-xs text-dimmed max-w-xs truncate" :title="JSON.stringify(row.original.details)">
            {{ row.original.details }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>