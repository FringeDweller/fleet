import type { Part, PartCategory } from '~/types'

export const useInventory = () => {
  const parts = ref<Part[]>([])
  const categories = ref<PartCategory[]>([])
  const locations = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)

  const { getCollection, putItem, getItem, queueOperation } = useOfflineSync()
  const online = useOnline()

  const fetchParts = async (params?: { q?: string, categoryId?: string, page?: number, limit?: number }) => {
    loading.value = true
    try {
      if (online.value) {
        const response = await $fetch<{ items: Part[], total: number }>('/api/inventory/parts', { params })
        parts.value = response.items
        total.value = response.total
        // Cache to IndexedDB
        for (const part of response.items) {
          await putItem('inventory', part)
        }
      } else {
        const data = await getCollection('inventory')
        parts.value = data
        total.value = data.length
      }
    } catch (error) {
      console.error('Failed to fetch parts, falling back to local storage', error)
      const data = await getCollection('inventory')
      parts.value = data
      total.value = data.length
    } finally {
      loading.value = false
    }
  }

  const fetchPart = async (id: string) => {
    return await $fetch<Part>(`/api/inventory/parts/${id}`)
  }

  const fetchCategories = async () => {
    categories.value = await $fetch<PartCategory[]>('/api/inventory/categories')
  }

  const createPart = async (data: Partial<Part>) => {
    if (online.value) {
      const part = await $fetch<Part>('/api/inventory/parts', {
        method: 'POST',
        body: data
      })
      await putItem('inventory', part)
      return part
    } else {
      const part = { ...data, id: crypto.randomUUID() } as Part
      await queueOperation('inventory', 'create', part)
      return part
    }
  }

  const updatePart = async (id: string, data: Partial<Part>) => {
    if (online.value) {
      const part = await $fetch<Part>(`/api/inventory/parts/${id}`, {
        method: 'PUT',
        body: data
      })
      await putItem('inventory', part)
      return part
    } else {
      const existing = await getItem('inventory', id)
      const part = { ...existing, ...data, id }
      await queueOperation('inventory', 'update', part)
      return part
    }
  }

  const createCategory = async (data: Partial<PartCategory>) => {
    return await $fetch<PartCategory>('/api/inventory/categories', {
      method: 'POST',
      body: data
    })
  }

  const fetchLocations = async () => {
    locations.value = await $fetch<any[]>('/api/inventory/locations')
  }

  const createLocation = async (data: any) => {
    return await $fetch('/api/inventory/locations', {
      method: 'POST',
      body: data
    })
  }

  const recordMovement = async (data: any) => {
    return await $fetch('/api/inventory/movements', {
      method: 'POST',
      body: data
    })
  }

  return {
    parts,
    categories,
    locations,
    loading,
    total,
    fetchParts,
    fetchPart,
    createPart,
    updatePart,
    fetchCategories,
    createCategory,
    fetchLocations,
    createLocation,
    recordMovement
  }
}
