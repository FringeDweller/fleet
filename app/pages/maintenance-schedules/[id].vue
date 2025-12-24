<script setup lang="ts">
import ScheduleForm from '~/components/maintenance-schedules/ScheduleForm.vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getSchedule, updateSchedule, deleteSchedule, loading } = useMaintenanceSchedules()

const schedule = ref<any>(null)
const initialLoading = ref(true)

onMounted(async () => {
  try {
    schedule.value = await getSchedule(route.params.id as string)
  } catch (e) {
    toast.add({ title: 'Error loading schedule', color: 'red' })
    router.push('/maintenance-schedules')
  } finally {
    initialLoading.value = false
  }
})

async function onSubmit(data: any) {
  try {
    await updateSchedule(route.params.id as string, data)
    toast.add({ title: 'Schedule updated', color: 'green' })
    router.push('/maintenance-schedules')
  } catch (e: any) {
    toast.add({ title: 'Error updating schedule', description: e.message, color: 'red' })
  }
}

async function onDelete() {
  if (!confirm('Are you sure you want to delete this schedule?')) return
  try {
    await deleteSchedule(route.params.id as string)
    toast.add({ title: 'Schedule deleted', color: 'green' })
    router.push('/maintenance-schedules')
  } catch (e: any) {
    toast.add({ title: 'Error deleting schedule', description: e.message, color: 'red' })
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
          <UButton label="Delete" color="red" variant="ghost" icon="i-lucide-trash" @click="onDelete" />
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
