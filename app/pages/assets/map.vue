<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { data: locations, refresh, pending } = await useFetch<{
  id: string
  assetId: string
  latitude: string
  longitude: string
  assetNumber: string
  assetMake: string
  assetModel: string
  assetStatus: string | null
  createdAt: string
}[]>('/api/assets/locations/latest')

// Auto-refresh every 30 seconds
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    refresh()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
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
        <DashboardAssetMap :locations="locations || []" class="flex-1" />
      </div>
    </template>
  </UDashboardPanel>
</template>
