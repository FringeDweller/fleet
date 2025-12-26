export const useMaintenanceSchedules = () => {
  const schedules = ref<any[]>([])
  const loading = ref(false)
  const error = ref<any>(null)

  const fetchSchedules = async (params: any = {}) => {
    loading.value = true
    try {
      const data: any = await $fetch('/api/maintenance-schedules', { params })
      schedules.value = data.items
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const getSchedule = async (id: string) => {
    return await $fetch(`/api/maintenance-schedules/${id}`)
  }

  const createSchedule = async (data: any) => {
    return await $fetch('/api/maintenance-schedules', {
      method: 'POST',
      body: data
    })
  }

  const updateSchedule = async (id: string, data: any) => {
    return await $fetch(`/api/maintenance-schedules/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteSchedule = async (id: string) => {
    await $fetch(`/api/maintenance-schedules/${id}`, {
      method: 'DELETE'
    })
    schedules.value = schedules.value.filter(s => s.id !== id)
  }

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
}
