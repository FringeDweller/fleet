export const useWorkOrders = () => {
  const workOrders = ref<any[]>([])
  const loading = ref(false)

  const { getCollection, putItem, getItem, queueOperation } = useOfflineSync()
  const online = useOnline()

  const fetchWorkOrders = async (params: any = {}) => {
    loading.value = true
    try {
      if (online.value) {
        const data: any = await $fetch('/api/work-orders', { params })
        workOrders.value = data.items
        for (const wo of data.items) {
          await putItem('work-orders', wo)
        }
      } else {
        workOrders.value = await getCollection('work-orders')
      }
    } catch (error) {
      console.error('Failed to fetch work orders', error)
      workOrders.value = await getCollection('work-orders')
    } finally {
      loading.value = false
    }
  }

  const getWorkOrder = async (id: string) => {
    if (online.value) {
      const wo = await $fetch(`/api/work-orders/${id}`)
      await putItem('work-orders', wo)
      return wo
    }
    return await getItem('work-orders', id)
  }

  const addPart = async (workOrderId: string, partId: string, quantity: number) => {
    const data = { workOrderId, partId, quantity: quantity.toString() }
    if (online.value) {
      return await $fetch(`/api/work-orders/${workOrderId}/parts`, {
        method: 'POST',
        body: data
      })
    } else {
      await queueOperation('work-order-parts', 'create', data)
      return data
    }
  }

  const completeWorkOrder = async (id: string, data: {
    checklist?: any[]
    completionMileage?: string
    completionHours?: string
    laborCost?: string
  }) => {
    if (online.value) {
      return await $fetch(`/api/work-orders/${id}/complete`, {
        method: 'POST',
        body: data
      })
    } else {
      const existing = await getItem('work-orders', id)
      const updated = { ...existing, ...data, status: 'completed' }
      await queueOperation('work-orders', 'update', updated)
      await putItem('work-orders', updated)
      return updated
    }
  }

  return {
    workOrders,
    loading,
    fetchWorkOrders,
    getWorkOrder,
    addPart,
    completeWorkOrder
  }
}
