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
  coordinates: { lat: number; lng: number }[] | null
  category: string
  alertOnEntry: 'always' | 'never' | 'after_hours'
  alertOnExit: 'always' | 'never' | 'after_hours'
  activeHours: { start: string; end: string; days: number[] } | null
  createdAt: string
}

const { data: geofences, refresh } = await useFetch<Geofence[]>('/api/geofences')

const isModalOpen = ref(false)
const isLogsModalOpen = ref(false)
const selectedGeofence = ref<Partial<Geofence>>({})
const logs = ref<Record<string, unknown>[]>([])

const _openCreateModal = () => {
  selectedGeofence.value = {
    name: '',
    description: '',
    type: 'circle',
    category: 'depot',
    radius: '100',
    centerLat: '0',
    centerLng: '0',
    coordinates: [],
    alertOnEntry: 'always',
    alertOnExit: 'always',
    activeHours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5] }
  }
  isModalOpen.value = true
}

const _openEditModal = (geofence: Geofence) => {
  selectedGeofence.value = { ...geofence }
  isModalOpen.value = true
}

const _openLogsModal = async (geofence: Geofence) => {
  selectedGeofence.value = geofence
  logs.value = await $fetch<Record<string, unknown>[]>(
    `/api/geofences/logs?geofenceId=${geofence.id}`
  )
  isLogsModalOpen.value = true
}

const _saveGeofence = async () => {
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

const _columns = [
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
        <UTable :rows="geofences as any[] || []" :columns="columns as any[]">
          <template #category-data="{ row }">
            <UBadge :color="(row as any).category === 'restricted' ? 'error' : 'primary'" variant="subtle">
              {{ (row as any).category }}
            </UBadge>
          </template>
          <template #createdAt-data="{ row }">
            {{ new Date((row as any).createdAt).toLocaleDateString() }}
          </template>
          <template #actions-data="{ row }">
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-clock"
                @click="openLogsModal(row as any)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                @click="openEditModal(row as any)"
              />
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal v-model:open="isLogsModalOpen" title="Geofence Activity Logs">
        <template #body>
          <UTable
            :rows="logs"
            :columns="[
              { key: 'assetId', label: 'Asset' },
              { key: 'entryTime', label: 'Entry' },
              { key: 'exitTime', label: 'Exit' },
              { key: 'durationMinutes', label: 'Duration (min)' }
            ] as any[]"
          >
            <template #entryTime-data="{ row }">
              {{ new Date((row as any).entryTime).toLocaleString() }}
            </template>
            <template #exitTime-data="{ row }">
              {{ (row as any).exitTime ? new Date((row as any).exitTime).toLocaleString() : '-' }}
            </template>
          </UTable>
        </template>
      </UModal>

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

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Alert on Entry" name="alertOnEntry">
                <USelect v-model="selectedGeofence.alertOnEntry" :items="['always', 'never', 'after_hours']" />
              </UFormField>
              <UFormField label="Alert on Exit" name="alertOnExit">
                <USelect v-model="selectedGeofence.alertOnExit" :items="['always', 'never', 'after_hours']" />
              </UFormField>
            </div>

            <div v-if="selectedGeofence.category === 'restricted' || selectedGeofence.alertOnEntry === 'after_hours' || selectedGeofence.alertOnExit === 'after_hours'" class="space-y-4 border-t pt-4">
              <p class="text-sm font-medium">
                Working Hours (for After Hours alerts)
              </p>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Start Time" name="activeHoursStart">
                  <UInput v-model="selectedGeofence.activeHours!.start" type="time" />
                </UFormField>
                <UFormField label="End Time" name="activeHoursEnd">
                  <UInput v-model="selectedGeofence.activeHours!.end" type="time" />
                </UFormField>
              </div>
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
