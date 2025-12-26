import type { Asset, AssetCategory } from '~/types'

export const useAssets = () => {
  const assets = ref<Asset[]>([])
  const categories = ref<AssetCategory[]>([])
  const loading = ref(false)

  const { getCollection, putItem, queueOperation } = useOfflineSync()
  const online = useOnline()

  const fetchAssets = async () => {
    loading.value = true
    try {
      if (online.value) {
        const data = await $fetch<Asset[]>('/api/assets')
        assets.value = data
        // Cache to IndexedDB
        for (const asset of data) {
          await putItem('assets', asset)
        }
      } else {
        assets.value = await getCollection('assets')
      }
    } catch (error) {
      console.error('Failed to fetch assets, falling back to local storage', error)
      assets.value = await getCollection('assets')
    } finally {
      loading.value = false
    }
  }

  const createAsset = async (data: Partial<Asset>) => {
    if (online.value) {
      const asset = await $fetch<Asset>('/api/assets', {
        method: 'POST',
        body: data
      })
      await putItem('assets', asset)
      return asset
    } else {
      const asset = { ...data, id: crypto.randomUUID() } as Asset
      await queueOperation('assets', 'create', asset)
      return asset
    }
  }

  const fetchCategories = async () => {
    categories.value = await $fetch('/api/assets/categories')
  }

  return {
    assets,
    categories,
    loading,
    fetchAssets,
    createAsset,
    fetchCategories
  }
}
