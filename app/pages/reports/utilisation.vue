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

const {
  data: report,
  status,
  refresh
} = await useAsyncData(
  'utilisation-report',
  () => {
    const params = new URLSearchParams()
    if (range.value.start) params.append('start', range.value.start.toISOString())
    if (range.value.end) params.append('end', range.value.end.toISOString())

    return $fetch<any>(`/api/reports/utilisation?${params.toString()}`)
  },
  {
    watch: [range]
  }
)

const columns = [
  { accessorKey: 'assetNumber', header: 'Asset' },
  { accessorKey: 'categoryName', header: 'Category' },
  { accessorKey: 'totalKm', header: 'Total Distance (km)' },
  { accessorKey: 'totalHours', header: 'Total Usage (hrs)' },
  { accessorKey: 'avgDailyKm', header: 'Avg Daily Km' },
  { accessorKey: 'utilizationScore', header: 'Utilisation Score' }
]

const getScoreColor = (score: number) => {
  if (score < 30) return 'error'
  if (score < 70) return 'warning'
  return 'success'
}

function _exportReport() {
  if (!report.value) return
  exportToCSV(
    report.value.data,
    columns,
    `utilisation-report-${new Date().toISOString().split('T')[0]}`
  )
}
</script>

<template>
  <UDashboardPanel id="utilisation-report">
    <template #header>
      <UDashboardNavbar title="Asset Utilisation Report" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <HomeDateRangePicker v-model="range" />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="status === 'pending'"
            @click="() => refresh()"
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UPageCard title="Fleet Avg Distance" icon="i-lucide-map-pin">
            <span class="text-2xl font-bold">{{ Math.round(report.fleetAvg.km) }} km</span>
          </UPageCard>
          <UPageCard title="Fleet Avg Hours" icon="i-lucide-clock">
            <span class="text-2xl font-bold">{{ Math.round(report.fleetAvg.hours) }} hrs</span>
          </UPageCard>
          <UPageCard title="Total Assets Tracked" icon="i-lucide-truck">
            <span class="text-2xl font-bold">{{ report.data.length }}</span>
          </UPageCard>
          <UPageCard title="Underutilised Assets" icon="i-lucide-alert-circle">
            <span class="text-2xl font-bold text-error">{{ report.data.filter((a: any) => a.utilizationScore < 30).length }}</span>
          </UPageCard>
        </div>

        <!-- Data Table -->
        <UTable :data="report.data" :columns="columns" class="bg-elevated/50 rounded-lg border border-default">
          <template #totalKm-cell="{ row }: { row: any }">
            {{ Math.round((row.original as any).totalKm) }} km
          </template>
          <template #totalHours-cell="{ row }: { row: any }">
            {{ Math.round((row.original as any).totalHours) }} hrs
          </template>
          <template #avgDailyKm-cell="{ row }: { row: any }">
            {{ (row.original as any).avgDailyKm.toFixed(1) }} km/day
          </template>
          <template #utilizationScore-cell="{ row }: { row: any }">
            <div class="flex items-center gap-3">
              <UProgress
                :value="(row.original as any).utilizationScore"
                :color="getScoreColor((row.original as any).utilizationScore)"
                class="w-24"
              />
              <span class="text-sm font-medium">{{ (row.original as any).utilizationScore }}%</span>
            </div>
          </template>
        </UTable>
      </div>
      <div v-else-if="status === 'pending'" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-dimmed" />
      </div>
    </template>
  </UDashboardPanel>
</template>
