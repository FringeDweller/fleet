export const useWorkOrders = () => {
  const workOrders = ref<any[]>([])
  const loading = ref(false)

  const { getCollection, putItem } = useOfflineSync()
  const online = useOnline()

  const fetchWorkOrders = async (params: any = {}) => {
    loading.value = true
    try {
      if (online.value) {
        const data: any = await $fetch('/api/work-orders', { params })
        workOrders.value = data.items
        // Cache to IndexedDB
        for (const wo of data.items) {
          await putItem('work-orders', wo)
        }
      } else {
        workOrders.value = await getCollection('work-orders')
      }
    } catch (error) {
      console.error('Failed to fetch work orders, falling back to local storage', error)
      workOrders.value = await getCollection('work-orders')
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
