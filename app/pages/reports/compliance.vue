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

interface ComplianceReport {
  inspections: { total: number, passed: number, failed: number }
  maintenance: { total: number, overdue: number }
  expiringCertifications: Array<{
    id: string
    userName: string
    type: string
    expiryDate: string
  }>
}

const { data: report, status, refresh } = await useAsyncData('compliance-report', () => {
  const params = new URLSearchParams()
  if (range.value.start) params.append('start', range.value.start.toISOString())
  if (range.value.end) params.append('end', range.value.end.toISOString())

  return $fetch<ComplianceReport>(`/api/reports/compliance?${params.toString()}`)
}, {
  watch: [range]
})

const certColumns = [
  { key: 'userName', label: 'User' },
  { key: 'type', label: 'Certification' },
  { key: 'expiryDate', label: 'Expiry Date' }
]

const inspectionCompliance = computed(() => {
  if (!report.value || report.value.inspections.total === 0) return 0
  return Math.round((report.value.inspections.passed / report.value.inspections.total) * 100)
})

const maintenanceCompliance = computed(() => {
  if (!report.value || report.value.maintenance.total === 0) return 100
  return Math.round(((report.value.maintenance.total - report.value.maintenance.overdue) / report.value.maintenance.total) * 100)
})
</script>

<template>
  <UDashboardPanel id="compliance-report">
    <template #header>
      <UDashboardNavbar title="Compliance Report">
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
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="report" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UPageCard title="Inspection Compliance" icon="i-lucide-shield-check">
            <div class="flex items-center gap-4">
              <span class="text-3xl font-bold" :class="inspectionCompliance < 80 ? 'text-error' : 'text-success'">
                {{ inspectionCompliance }}%
              </span>
              <div class="text-xs text-dimmed">
                {{ report.inspections.passed }} passed / {{ report.inspections.total }} total
              </div>
            </div>
          </UPageCard>
          <UPageCard title="Maintenance Compliance" icon="i-lucide-calendar-check">
            <div class="flex items-center gap-4">
              <span class="text-3xl font-bold" :class="maintenanceCompliance < 90 ? 'text-error' : 'text-success'">
                {{ maintenanceCompliance }}%
              </span>
              <div class="text-xs text-dimmed">
                {{ report.maintenance.overdue }} overdue / {{ report.maintenance.total }} scheduled
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Expiring Certifications -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <UIcon name="i-lucide-award" />
            Expiring Certifications (Next 30 Days)
          </h3>
          <UTable :data="report.expiringCertifications" :columns="certColumns as any[]" class="bg-elevated/50 rounded-lg border border-default">
            <template #expiryDate-cell="{ row }">
              <span class="text-error font-medium">{{ new Date(row.original.expiryDate).toLocaleDateString() }}</span>
            </template>
          </UTable>
          <div v-if="report.expiringCertifications.length === 0" class="text-center py-8 text-dimmed border border-dashed rounded-lg">
            No certifications expiring in the next 30 days.
          </div>
        </div>
      </div>
      <div v-else-if="status === 'pending'" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-dimmed" />
      </div>
    </template>
  </UDashboardPanel>
</template>
