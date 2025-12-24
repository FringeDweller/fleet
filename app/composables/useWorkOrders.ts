export const useWorkOrders = () => {
  const workOrders = ref<any[]>([])
  const loading = ref(false)

  const fetchWorkOrders = async (params: any = {}) => {
    loading.value = true
    try {
      const data: any = await $fetch('/api/work-orders', { params })
      workOrders.value = data.items
    } finally {
      loading.value = false
    }
  }

  return {
    workOrders,
    loading,
    fetchWorkOrders
  }
}
