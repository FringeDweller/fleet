export const useMaintenanceTasks = () => {
  const tasks = ref<any[]>([])
  const groups = ref<any[]>([])
  const loading = ref(false)

  const fetchTasks = async () => {
    loading.value = true
    try {
      tasks.value = await $fetch('/api/maintenance-tasks')
    } finally {
      loading.value = false
    }
  }

  const fetchGroups = async () => {
    groups.value = await $fetch('/api/maintenance-tasks/groups')
  }

  return {
    tasks,
    groups,
    loading,
    fetchTasks,
    fetchGroups
  }
}
