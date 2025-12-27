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
  }
]
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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
    </template>
  </UDashboardPanel>
</template>
