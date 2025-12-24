import type { Asset, AssetCategory } from '~/types'

export const useAssets = () => {
  const assets = ref<Asset[]>([])
  const categories = ref<AssetCategory[]>([])
  const loading = ref(false)

  const fetchAssets = async () => {
    loading.value = true
    try {
      assets.value = await $fetch('/api/assets')
    } finally {
      loading.value = false
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
    fetchCategories
  }
}