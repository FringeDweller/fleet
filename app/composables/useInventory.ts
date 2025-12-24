import type { Part, PartCategory } from '~/types'

export const useInventory = () => {
  const parts = ref<Part[]>([])
  const categories = ref<PartCategory[]>([])
  const locations = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)

  const fetchParts = async (params?: { q?: string, categoryId?: string, page?: number, limit?: number }) => {
    loading.value = true
    try {
      const response = await $fetch<{ items: Part[], total: number }>('/api/inventory/parts', { params })
      parts.value = response.items
      total.value = response.total
    } finally {
      loading.value = false
    }
  }

  const fetchPart = async (id: string) => {
    return await $fetch<Part>(`/api/inventory/parts/${id}`)
  }

  const createPart = async (data: Partial<Part>) => {
    return await $fetch<Part>('/api/inventory/parts', {
      method: 'POST',
      body: data
    })
  }

  const updatePart = async (id: string, data: Partial<Part>) => {
    return await $fetch<Part>(`/api/inventory/parts/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const fetchCategories = async () => {
    categories.value = await $fetch<PartCategory[]>('/api/inventory/categories')
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