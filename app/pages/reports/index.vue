<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const reports = [
  {
    title: 'Asset Utilisation',
    description: 'Track usage hours and distance per asset with fleet comparisons.',
    icon: 'i-lucide-truck',
    to: '/reports/utilisation'
  },
  {
    title: 'Maintenance Costs',
    description: 'Detailed breakdown of labor and parts costs per asset.',
    icon: 'i-lucide-dollar-sign',
    to: '/reports/maintenance-costs'
  },
  {
    title: 'Technician Performance',
    description: 'Track work order completion rates and efficiency per technician.',
    icon: 'i-lucide-user-check',
    to: '/reports/technician-performance'
  },
  {
    title: 'Compliance Report',
    description: 'Monitor inspection rates, maintenance adherence, and certifications.',
    icon: 'i-lucide-shield-alert',
    to: '/reports/compliance'
  },
  {
    title: 'Custom Report Builder',
    description: 'Build your own reports by selecting data sources and columns.',
    icon: 'i-lucide-settings-2',
    to: '/reports/builder'
  }
]
interface CustomReport {
  id: string
  name: string
  description: string | null
}

const { data: savedReports } = useLazyFetch<CustomReport[]>('/api/reports/custom')
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Reports">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-8">
        <div>
          <h3 class="text-lg font-bold mb-4">
            Standard Reports
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="report in reports"
              :key="report.to"
              variant="subtle"
              class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
              @click="navigateTo(report.to)"
            >
              <div class="flex items-center gap-3">
                <UIcon :name="report.icon" class="w-6 h-6 text-primary" />
                <div>
                  <div class="font-bold">{{ report.title }}</div>
                  <div class="text-sm text-gray-500">{{ report.description }}</div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div v-if="savedReports && savedReports.length > 0">
          <h3 class="text-lg font-bold mb-4">
            Saved Reports
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="report in savedReports"
              :key="report.id"
              variant="subtle"
              class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
              @click="navigateTo(`/reports/custom/${report.id}`)"
            >
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-file-spreadsheet" class="w-6 h-6 text-primary" />
                <div>
                  <div class="font-bold">{{ report.name }}</div>
                  <div class="text-sm text-gray-500">{{ report.description || 'Custom report' }}</div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>