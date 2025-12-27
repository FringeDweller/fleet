<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const _reports = [
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

const { data: savedReports } = await useFetch<CustomReport[]>('/api/reports/custom')
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Reports">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="New Custom Report" icon="i-lucide-plus" to="/reports/builder" />
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
            <UPageCard
              v-for="report in reports"
              :key="report.to"
              :title="report.title"
              :description="report.description"
              :icon="report.icon"
              :to="report.to"
              variant="subtle"
              class="hover:ring-2 hover:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div v-if="savedReports && savedReports.length > 0">
          <h3 class="text-lg font-bold mb-4">
            Saved Reports
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UPageCard
              v-for="report in savedReports"
              :key="report.id"
              :title="report.name"
              :description="report.description || 'Custom report'"
              icon="i-lucide-file-spreadsheet"
              :to="`/reports/custom/${report.id}`"
              variant="subtle"
              class="hover:ring-2 hover:ring-primary-500 transition-all"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
