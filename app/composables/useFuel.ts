export const useFuel = () => {
  const loading = ref(false)
  const { queueOperation, putItem, getCollection } = useOfflineSync()
  const online = useOnline()

  const recordTransaction = async (data: any) => {
    loading.value = true
    try {
      if (online.value) {
        const result = await $fetch('/api/fuel', {
          method: 'POST',
          body: data
        })
        await putItem('fuel-transactions', result)
        return result
      } else {
        const transaction = {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString()
        }
        await queueOperation('fuel-transactions', 'create', transaction)
        await putItem('fuel-transactions', transaction)
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
    return all.filter((t: any) => t.assetId === assetId)
  }

  return {
    loading,
    recordTransaction,
    getHistory
  }
}
