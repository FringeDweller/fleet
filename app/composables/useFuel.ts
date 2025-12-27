export const useFuel = () => {
  const loading = ref(false)
  const { queueOperation, putItem, getCollection } = useOfflineSync()
  const online = useOnline()

  const recordTransaction = async (data: Record<string, unknown>) => {
    loading.value = true
    try {
      if (online.value) {
        const result = await $fetch('/api/fuel', {
          method: 'POST',
          body: data
        })
        await putItem('fuel-transactions', result as Record<string, unknown>)
        return result
      } else {
        const transaction = {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString()
        }
        await queueOperation('fuel-transactions', 'create', transaction as Record<string, unknown>)
        await putItem('fuel-transactions', transaction as Record<string, unknown>)
        return transaction
      }
    } finally {
      loading.value = false
    }
  }

  const getHistory = async (assetId: string) => {
    // For simplicity, we filter the local collection or fetch from API
    if (online.value) {
      // In a real app, we might have a GET /api/fuel?assetId=...
    }
    const all = await getCollection('fuel-transactions')
    return all.filter((t: Record<string, unknown>) => t.assetId === assetId)
  }

  return {
    loading,
    recordTransaction,
    getHistory
  }
}
