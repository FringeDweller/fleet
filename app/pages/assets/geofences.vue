<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

interface Geofence {
  id?: string
  name: string
  description: string | null
  type: 'circle' | 'polygon'
  centerLat: string | null
  centerLng: string | null
  radius: string | null
  coordinates: { lat: number, lng: number }[] | null
  category: string
  createdAt: string
}

const { data: geofences, refresh } = await useFetch<Geofence[]>('/api/geofences')

const isModalOpen = ref(false)
const selectedGeofence = ref<Partial<Geofence>>({})

const openCreateModal = () => {
  selectedGeofence.value = {
    name: '',
    description: '',
    type: 'circle',
    category: 'depot',
    radius: '100',
    centerLat: '0',
    centerLng: '0',
    coordinates: []
  }
  isModalOpen.value = true
}

const openEditModal = (geofence: Geofence) => {
  selectedGeofence.value = { ...geofence }
  isModalOpen.value = true
}

const saveGeofence = async () => {
  if (selectedGeofence.value.id) {
    await $fetch(`/api/geofences/${selectedGeofence.value.id}`, {
      method: 'PUT',
      body: selectedGeofence.value
    })
  } else {
    await $fetch('/api/geofences', {
      method: 'POST',
      body: selectedGeofence.value
    })
  }
  isModalOpen.value = false
  refresh()
}

const deleteGeofence = async (id: string) => {
  if (confirm('Are you sure you want to delete this geofence?')) {
    await $fetch(`/api/geofences/${id}`, {
      method: 'DELETE'
    })
    refresh()
  }
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: '' }
]
</script>

<template>
  <UDashboardPanel id="geofences">
    <template #header>
      <UDashboardNavbar title="Geofences">
        <template #right>
          <UButton icon="i-heroicons-plus" label="New Geofence" @click="openCreateModal" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <UTable :rows="geofences || []" :columns="columns">
          <template #category-data="{ row }">
            <UBadge :color="row.category === 'restricted' ? 'error' : 'primary'" variant="subtle">
              {{ row.category }}
            </UBadge>
          </template>
          <template #createdAt-data="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>
          <template #actions-data="{ row }">
            <div class="flex justify-end gap-2">
              <UButton
                icon="i-heroicons-pencil-square"
                color="neutral"
                variant="ghost"
                @click="openEditModal(row)"
              />
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                @click="deleteGeofence(row.id)"
              />
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal v-model:open="isModalOpen" title="Geofence Details">
        <template #body>
          <UForm :state="selectedGeofence" class="space-y-4" @submit="saveGeofence">
            <UFormField label="Name" name="name" required>
              <UInput v-model="selectedGeofence.name" />
            </UFormField>
            <UFormField label="Description" name="description">
              <UTextarea v-model="selectedGeofence.description" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Type" name="type">
                <USelect v-model="selectedGeofence.type" :items="['circle', 'polygon']" />
              </UFormField>
              <UFormField label="Category" name="category">
                <USelect v-model="selectedGeofence.category" :items="['depot', 'job_site', 'restricted', 'other']" />
              </UFormField>
            </div>

            <div v-if="selectedGeofence.type === 'circle'" class="space-y-4 border-t pt-4">
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Center Latitude" name="centerLat">
                  <UInput v-model="selectedGeofence.centerLat" type="number" step="0.0000001" />
                </UFormField>
                <UFormField label="Center Longitude" name="centerLng">
                  <UInput v-model="selectedGeofence.centerLng" type="number" step="0.0000001" />
                </UFormField>
              </div>
              <UFormField label="Radius (meters)" name="radius">
                <UInput v-model="selectedGeofence.radius" type="number" />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                @click="isModalOpen = false"
              />
              <UButton type="submit" label="Save" color="primary" />
            </div>
          </UForm>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
