<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { schedules: _schedules, fetchSchedules } = useMaintenanceSchedules()
const { workOrders: _workOrders, fetchWorkOrders } = useWorkOrders()
const loading = ref(true)

onMounted(async () => {
  await Promise.all([fetchSchedules(), fetchWorkOrders({ limit: 100 })])
  loading.value = false
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Maintenance Calendar">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-list"
            label="List View"
            to="/maintenance-schedules"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard class="h-full flex flex-col">
        <MaintenanceCalendar v-if="!loading" :schedules="schedules" :work-orders="workOrders" />
        <div v-else class="flex justify-center p-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8" />
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
