export const useMaintenanceTasks = () => {
  const tasks = ref<Record<string, unknown>[]>([])
  const groups = ref<Record<string, unknown>[]>([])
  const loading = ref(false)

  const { getCollection, putItem } = useOfflineSync()
  const online = useOnline()

  const fetchTasks = async () => {
    loading.value = true
    try {
      if (online.value) {
        const data = await $fetch<Record<string, unknown>[]>('/api/maintenance-tasks')
        tasks.value = data
        // Cache to IndexedDB
        for (const task of data) {
          await putItem('maintenance-tasks', task)
        }
      } else {
        tasks.value = await getCollection('maintenance-tasks')
      }
    } catch (error) {
      console.error('Failed to fetch tasks, falling back to local storage', error)
      tasks.value = await getCollection('maintenance-tasks')
    } finally {
      loading.value = false
    }
  }

  const fetchGroups = async () => {
    groups.value = await $fetch<Record<string, unknown>[]>('/api/maintenance-tasks/groups')
  }

  return {
    tasks,
    groups,
    loading,
    fetchTasks,
    fetchGroups
  }
}
