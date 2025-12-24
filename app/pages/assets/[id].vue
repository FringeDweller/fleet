<script setup lang="ts">
import type { Asset } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const id = route.params.id as string

const { data: asset, pending: loading } = await useFetch<Asset>(`/api/assets/${id}`)

const items = [
  { label: 'Overview', icon: 'i-lucide-info' },
  { label: 'Work Orders', icon: 'i-lucide-wrench' },
  { label: 'Maintenance', icon: 'i-lucide-calendar' },
  { label: 'Parts', icon: 'i-lucide-package' },
  { label: 'Inspections', icon: 'i-lucide-clipboard-check' }
]
</script>

<template>
  <UDashboardPanel id="asset-detail">
    <template #header>
      <UDashboardNavbar :title="asset?.assetNumber || 'Asset Details'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/assets" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-gray-400" />
      </div>

      <div v-else-if="asset && !Array.isArray(asset)" class="space-y-6">
        <UTabs :items="items" class="w-full">
          <template #content="{ item }">
            <UCard v-if="item.label === 'Overview'">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section class="space-y-4">
                  <h3 class="text-lg font-semibold">
                    General Information
                  </h3>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <span class="text-gray-500">Make</span>
                    <span class="font-medium">{{ asset.make }}</span>
                    <span class="text-gray-500">Model</span>
                    <span class="font-medium">{{ asset.model }}</span>
                    <span class="text-gray-500">Year</span>
                    <span class="font-medium">{{ asset.year }}</span>
                    <span class="text-gray-500">VIN</span>
                    <span class="font-medium">{{ asset.vin || 'N/A' }}</span>
                    <span class="text-gray-500">License Plate</span>
                    <span class="font-medium">{{ asset.licensePlate || 'N/A' }}</span>
                  </div>
                </section>

                <section class="space-y-4">
                  <h3 class="text-lg font-semibold">
                    Operational Data
                  </h3>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <span class="text-gray-500">Status</span>
                    <UBadge
                      :color="asset.status === 'active' ? 'success' : 'neutral'"
                      variant="subtle"
                    >
                      {{ asset.status }}
                    </UBadge>
                    <span class="text-gray-500">Mileage</span>
                    <span class="font-medium">{{ asset.currentMileage }} km</span>
                    <span class="text-gray-500">Hours</span>
                    <span class="font-medium">{{ asset.currentHours }} hrs</span>
                  </div>
                </section>
              </div>
            </UCard>

            <UCard v-else>
              <div class="flex flex-col items-center justify-center h-32 text-gray-500">
                <UIcon :name="item.icon" class="size-8 mb-2" />
                <p>{{ item.label }} feature coming soon</p>
              </div>
            </UCard>
          </template>
        </UTabs>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-64 text-gray-500">
        <UIcon name="i-lucide-alert-circle" class="size-12 mb-4" />
        <p class="text-lg">
          Asset not found
        </p>
        <UButton to="/assets" variant="link">
          Back to Assets
        </UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
