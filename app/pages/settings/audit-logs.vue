<script setup lang="ts">
const { data: _logs, refresh } = await useFetch('/api/settings/audit-logs')

const _columns = [
  { key: 'createdAt', label: 'Time' },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'entityType', label: 'Entity' },
  { key: 'details', label: 'Details' }
]

function _exportLogs() {
  if (!_logs.value) return
  const data = _logs.value.map((l: any) => ({
    ...l,
    user: l.user?.name || 'System',
    details: JSON.stringify(l.details)
  }))
  exportToCSV(data, _columns, `audit-logs-${new Date().toISOString().split('T')[0]}`)
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Audit Log"
      description="Track all modifications and security events in your organisation."
      variant="naked"
    >
      <template #right>
        <UButton
          icon="i-lucide-download"
          label="Export CSV"
          variant="soft"
          color="neutral"
          @click="_exportLogs"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ body: 'p-0' }">
      <UTable
        :rows="_logs || []"
        :columns="_columns"
      >
        <template #createdAt-data="{ row }">
          <div class="text-xs text-dimmed">
            {{ new Date(row.createdAt).toLocaleString() }}
          </div>
        </template>

        <template #user-data="{ row }">
          <div class="text-sm font-medium text-highlighted">
            {{ row.user?.name || 'System' }}
          </div>
        </template>

        <template #action-data="{ row }">
          <UBadge
            :color="row.action === 'delete' ? 'error' : (row.action === 'create' ? 'success' : 'primary')"
            variant="subtle"
            size="xs"
            class="capitalize"
          >
            {{ row.action }}
          </UBadge>
        </template>

        <template #details-data="{ row }">
          <div class="text-xs text-dimmed max-w-xs truncate" :title="JSON.stringify(row.details)">
            {{ row.details }}
          </div>
        </template>
      </UTable>
    </UPageCard>
  </div>
</template>
