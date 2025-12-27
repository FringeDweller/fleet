export const useMaintenanceSchedules = () => {
  const schedules = ref<Record<string, unknown>[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchSchedules = async (params: Record<string, unknown> = {}) => {
    loading.value = true
    try {
      const data = await $fetch<{ items: Record<string, unknown>[] }>(
        '/api/maintenance-schedules',
        { params }
      )
      schedules.value = data.items
    } catch (e: unknown) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  const getSchedule = async (id: string) => {
    return await $fetch<Record<string, unknown>>(`/api/maintenance-schedules/${id}`)
  }

  const createSchedule = async (data: Record<string, unknown>) => {
    return await $fetch('/api/maintenance-schedules', {
      method: 'POST',
      body: data
    })
  }

  const updateSchedule = async (id: string, data: Record<string, unknown>) => {
    return await $fetch(`/api/maintenance-schedules/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteSchedule = async (id: string) => {
    await $fetch(`/api/maintenance-schedules/${id}`, {
      method: 'DELETE'
    })
    schedules.value = schedules.value.filter((s) => s.id !== id)
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
