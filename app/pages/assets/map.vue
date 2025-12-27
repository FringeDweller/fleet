<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const {
  data: _locations,
  refresh: _refreshLocations,
  pending: _loadingLocations
} = await useFetch<{ assetId: string; latitude: number; longitude: number; assetName: string }[]>(
  '/api/assets/locations/latest'
)

const { data: _geofences } = await useFetch<Record<string, unknown>[]>('/api/geofences')

const _refresh = () => {
  _refreshLocations()
}
</script>

<template>
  <UDashboardPanel id="fleet-map">
    <template #header>
      <UDashboardNavbar title="Fleet Map">
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="_loadingLocations" class="text-xs text-gray-500 flex items-center gap-1">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
              Updating...
            </span>
            <UButton
              icon="i-heroicons-arrow-path"
              color="neutral"
              variant="ghost"
              @click="_refresh"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex-1 flex flex-col min-h-0 h-full">
        <DashboardAssetMap :locations="_locations || []" :geofences="_geofences || []" class="flex-1" />
      </div>
    </template>
  </UDashboardPanel>
</template>
