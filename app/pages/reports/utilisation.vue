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

const {
  data: report,
  status,
  error,
  refresh
} = useLazyAsyncData(
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
</script>

<template>
  <UDashboardPanel id="utilisation-report">
    <template #header>
      <UDashboardNavbar title="Asset Utilisation Report">
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div v-if="error" class="p-4 bg-error/10 text-error rounded-lg mb-6">
          <p class="font-bold">Error loading report:</p>
          <p>{{ error.message }}</p>
          <UButton color="error" variant="soft" class="mt-2" @click="() => refresh()">Retry</UButton>
        </div>

        <div v-if="report" class="space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
                  <span class="font-semibold text-sm text-gray-500">Fleet Avg Distance</span>
                </div>
              </template>
              <span class="text-2xl font-bold">{{ Math.round(report.fleetAvg.km) }} km</span>
            </UCard>
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-clock" class="w-5 h-5 text-primary" />
                  <span class="font-semibold text-sm text-gray-500">Fleet Avg Hours</span>
                </div>
              </template>
              <span class="text-2xl font-bold">{{ Math.round(report.fleetAvg.hours) }} hrs</span>
            </UCard>
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-truck" class="w-5 h-5 text-primary" />
                  <span class="font-semibold text-sm text-gray-500">Total Assets Tracked</span>
                </div>
              </template>
              <span class="text-2xl font-bold">{{ report.data.length }}</span>
            </UCard>
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-error" />
                  <span class="font-semibold text-sm text-gray-500">Underutilised Assets</span>
                </div>
              </template>
              <span class="text-2xl font-bold text-error">{{ report.data.filter((a: any) => a.utilizationScore < 30).length }}</span>
            </UCard>
          </div>

          <UCard :ui="{ body: 'p-0' }">
            <UTable :data="report.data" :columns="columns" />
          </UCard>
        </div>
        <div v-else-if="status === 'pending'" class="flex flex-col items-center justify-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-dimmed mb-2" />
          <p class="text-dimmed">Loading report data...</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>