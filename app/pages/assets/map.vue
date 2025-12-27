<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const {
  data: locations,
  refresh: refreshLocations,
  pending: loadingLocations
} = await useFetch<
  {
    id: string
    assetId: string
    latitude: string
    longitude: string
    assetNumber: string
    assetMake: string
    assetModel: string
    assetStatus: string | null
    createdAt: string
  }[]
>('/api/assets/locations/latest')

const { data: geofences } =
  await useFetch<
    {
      id: string
      name: string
      type: 'circle' | 'polygon'
      centerLat: string | null
      centerLng: string | null
      radius: string | null
      coordinates: { lat: number; lng: number }[] | null
      category: string
    }[]
  >('/api/geofences')

const _refresh = () => {
  refreshLocations()
}

const _pending = computed(() => loadingLocations.value)
</script>

<template>
  <UDashboardPanel id="fleet-map">
    <template #header>
      <UDashboardNavbar title="Fleet Map">
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="pending" class="text-xs text-gray-500 flex items-center gap-1">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
              Updating...
            </span>
            <UButton
              icon="i-heroicons-arrow-path"
              color="neutral"
              variant="ghost"
              @click="refresh"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex-1 flex flex-col min-h-0 h-full">
        <DashboardAssetMap :locations="locations || []" :geofences="geofences || []" class="flex-1" />
      </div>
    </template>
  </UDashboardPanel>
</template>
