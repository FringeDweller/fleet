<script setup lang="ts">
import { sub } from 'date-fns'
import type { Range } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 30 }),
  end: new Date()
})

interface TechPerformance {
  technicianId: string
  technicianName: string
  completedOrders: number
  avgCompletionTimeHrs: number
  totalLaborCost: number
}

const {
  data: _report,
  status: _status,
  refresh: _refresh
} = useLazyAsyncData(
  'tech-performance-report',
  () => {
    const params = new URLSearchParams()
    if (range.value.start) params.append('start', range.value.start.toISOString())
    if (range.value.end) params.append('end', range.value.end.toISOString())

    return $fetch<TechPerformance[]>(`/api/reports/technician-performance?${params.toString()}`)
  },
  {
    watch: [range]
  }
)

const columns = [
  { accessorKey: 'technicianName', header: 'Technician' },
  { accessorKey: 'completedOrders', header: 'Orders Completed' },
  { accessorKey: 'avgCompletionTimeHrs', header: 'Avg Time (hrs)' },
  { accessorKey: 'totalLaborCost', header: 'Total Labor Cost' }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function _exportReport() {
  if (!_report.value) return
  // exportToCSV(_report.value as unknown as Record<string, unknown>[], columns, `tech-performance-report-${new Date().toISOString().split('T')[0]}`)
}
</script>

<template>
  <UDashboardPanel id="tech-performance-report">
    <template #header>
      <UDashboardNavbar title="Technician Performance Report" :ui="{ right: 'gap-3' }">
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
      <div v-if="_report" class="p-6 space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-primary" />
                <span class="font-semibold text-sm text-gray-500">Total Orders Completed</span>
              </div>
            </template>
            <span class="text-2xl font-bold">{{ _report.reduce((acc, curr) => acc + curr.completedOrders, 0) }}</span>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-primary" />
                <span class="font-semibold text-sm text-gray-500">Fleet Avg Completion Time</span>
              </div>
            </template>
            <span class="text-2xl font-bold">
              {{ (_report.reduce((acc, curr) => acc + curr.avgCompletionTimeHrs, 0) / (_report.length || 1)).toFixed(1) }} hrs
            </span>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-primary" />
                <span class="font-semibold text-sm text-gray-500">Total Labor Efficiency</span>
              </div>
            </template>
            <span class="text-2xl font-bold text-primary">{{ formatCurrency(_report.reduce((acc, curr) => acc + curr.totalLaborCost, 0)) }}</span>
          </UCard>
        </div>

        <!-- Data Table -->
        <UCard :ui="{ body: 'p-0' }">
          <UTable :data="_report" :columns="columns" class="bg-elevated/50 rounded-lg">
            <template #avgCompletionTimeHrs-cell="{ row }">
              {{ row.original.avgCompletionTimeHrs.toFixed(1) }} hrs
            </template>
            <template #totalLaborCost-cell="{ row }">
              {{ formatCurrency(row.original.totalLaborCost) }}
            </template>
          </UTable>
        </UCard>
      </div>
      <div v-else-if="_status === 'pending'" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-dimmed" />
      </div>
    </template>
  </UDashboardPanel>
</template>