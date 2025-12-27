<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { createSchedule, loading } = useMaintenanceSchedules()
const router = useRouter()
const toast = useToast()

async function onSubmit(data: Record<string, unknown>) {
  try {
    await createSchedule(data)
    toast.add({ title: 'Schedule created', color: 'success' })
    router.push('/maintenance-schedules')
  } catch (e: unknown) {
    toast.add({
      title: 'Error creating schedule',
      description: (e as Error).message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="New Schedule">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/maintenance-schedules" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <ScheduleForm :loading="loading" @submit="onSubmit" />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
