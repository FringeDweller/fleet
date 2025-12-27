<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getSchedule, updateSchedule, deleteSchedule, loading } = useMaintenanceSchedules()

const schedule = ref<Record<string, unknown> | null>(null)
const initialLoading = ref(true)

onMounted(async () => {
  try {
    schedule.value = await getSchedule(route.params.id as string)
  } catch (error: unknown) {
    console.error(error)
    toast.add({ title: 'Error loading schedule', color: 'error' })
    router.push('/maintenance-schedules')
  } finally {
    initialLoading.value = false
  }
})

async function onSubmit(data: Record<string, unknown>) {
  try {
    await updateSchedule(route.params.id as string, data)
    toast.add({ title: 'Schedule updated', color: 'success' })
    router.push('/maintenance-schedules')
  } catch (error: unknown) {
    console.error(error)
    toast.add({
      title: 'Error updating schedule',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

async function onDelete() {
  if (!confirm('Are you sure you want to delete this schedule?')) return
  try {
    await deleteSchedule(route.params.id as string)
    toast.add({ title: 'Schedule deleted', color: 'success' })
    router.push('/maintenance-schedules')
  } catch (error: unknown) {
    console.error(error)
    toast.add({
      title: 'Error deleting schedule',
      description: (error as Error).message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Edit Schedule">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/maintenance-schedules" />
        </template>
        <template #right>
          <UButton
            label="Delete"
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            @click="onDelete"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard v-if="!initialLoading && schedule">
        <ScheduleForm :initial-data="schedule" :loading="loading" @submit="onSubmit" />
      </UCard>
      <div v-else class="p-4 flex justify-center">
        <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8" />
      </div>
    </template>
  </UDashboardPanel>
</template>
