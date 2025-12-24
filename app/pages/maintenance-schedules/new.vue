<script setup lang="ts">
import ScheduleForm from '~/components/maintenance-schedules/ScheduleForm.vue'

definePageMeta({
  middleware: 'auth'
})

const { createSchedule, loading } = useMaintenanceSchedules()
const router = useRouter()
const toast = useToast()

async function onSubmit(data: any) {
  try {
    await createSchedule(data)
    toast.add({ title: 'Schedule created', color: 'green' })
    router.push('/maintenance-schedules')
  } catch (e: any) {
    toast.add({ title: 'Error creating schedule', description: e.message, color: 'red' })
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
