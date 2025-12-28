<script setup lang="ts">
import type { AssetLocation, Geofence } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const {
  data: locations,
  refresh: refreshLocations,
  status: loadStatus
} = await useFetch<AssetLocation[]>('/api/assets/locations/latest')

const { data: geofences } = await useFetch<Geofence[]>('/api/geofences')

const refresh = () => {
  refreshLocations()
}

const loadingLocations = computed(() => loadStatus.value === 'pending')
</script>

<template>
  <UDashboardPanel id="fleet-map">
    <template #header>
      <UDashboardNavbar title="Fleet Map">
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="loadingLocations" class="text-xs text-gray-500 flex items-center gap-1">
              <UIcon name="i-lucide-refresh-cw" class="animate-spin" />
              Updating...
            </span>
            <UButton
              icon="i-lucide-refresh-cw"
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
