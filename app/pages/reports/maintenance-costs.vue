<script setup lang="ts">
import { sub } from 'date-fns'
import type { Range } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const range = ref<Range>({
  start: sub(new Date(), { days: 30 }),
  end: new Date()
})

interface MaintenanceCostAsset {
  assetId: string

  assetNumber: string

  categoryName: string

  laborCost: number

  partsCost: number

  totalCost: number
}

const {
  data: report,
  status: _status,
  refresh: _refresh
} = await useAsyncData(
  'maintenance-costs-report',
  () => {
    const params = new URLSearchParams()

    if (range.value.start) params.append('start', range.value.start.toISOString())

    if (range.value.end) params.append('end', range.value.end.toISOString())

    return $fetch<MaintenanceCostAsset[]>(`/api/reports/maintenance-costs?${params.toString()}`)
  },
  {
    watch: [range]
  }
)

const _columns = [
  { key: 'assetNumber', label: 'Asset' },

  { key: 'categoryName', label: 'Category' },

  { key: 'laborCost', label: 'Labor Cost' },

  { key: 'partsCost', label: 'Parts Cost' },

  { key: 'totalCost', label: 'Total Cost' }
]

function _formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',

    currency: 'AUD'
  }).format(value)
}

const _totals = computed(() => {
  if (!report.value) return { labor: 0, parts: 0, total: 0 }

  return report.value.reduce(
    (acc, curr) => {
      acc.labor += curr.laborCost
      acc.parts += curr.partsCost
      acc.total += curr.totalCost
      return acc
    },
    { labor: 0, parts: 0, total: 0 }
  )
})

function _exportReport() {
  if (!report.value) return
  exportToCSV(report.value, _columns, `maintenance-costs-report-${new Date().toISOString().split('T')[0]}`)
}
</script>

<template>
  <UDashboardPanel id="maintenance-costs-report">
    <template #header>
      <UDashboardNavbar title="Maintenance Cost Report" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <HomeDateRangePicker v-model="range" />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="_status === 'pending'"
            @click="() => _refresh()"
          />
          <UButton
            icon="i-lucide-download"
            label="Export"
            variant="soft"
            color="neutral"
            @click="_exportReport"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="report" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UPageCard title="Total Labor Cost" icon="i-lucide-user">
            <span class="text-2xl font-bold">{{ _formatCurrency(_totals.labor) }}</span>
          </UPageCard>
          <UPageCard title="Total Parts Cost" icon="i-lucide-package">
            <span class="text-2xl font-bold">{{ _formatCurrency(_totals.parts) }}</span>
          </UPageCard>
          <UPageCard title="Total Maintenance Cost" icon="i-lucide-dollar-sign">
            <span class="text-2xl font-bold text-primary">{{ _formatCurrency(_totals.total) }}</span>
          </UPageCard>
        </div>

        <!-- Data Table -->
        <UTable :data="report" :columns="_columns as any[]" class="bg-elevated/50 rounded-lg border border-default">
          <template #laborCost-cell="{ row }">
            {{ _formatCurrency(row.original.laborCost) }}
          </template>
          <template #partsCost-cell="{ row }">
            {{ _formatCurrency(row.original.partsCost) }}
          </template>
          <template #totalCost-cell="{ row }">
            <span class="font-bold">{{ _formatCurrency(row.original.totalCost) }}</span>
          </template>
        </UTable>
      </div>
      <div v-else-if="_status === 'pending'" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-dimmed" />
      </div>
    </template>
  </UDashboardPanel>
</template>
