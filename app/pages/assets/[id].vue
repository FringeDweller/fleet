<script setup lang="ts">
const route = useRoute()
const assetId = route.params.id as string

const { data: asset, pending } = await useFetch(`/api/assets/${assetId}`)

const items = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Work Orders', slot: 'work-orders', disabled: true },
  { label: 'Maintenance', slot: 'maintenance', disabled: true },
  { label: 'Parts', slot: 'parts', disabled: true },
  { label: 'Inspections', slot: 'inspections', disabled: true },
  { label: 'Fuel', slot: 'fuel', disabled: true },
  { label: 'Documents', slot: 'documents', disabled: true },
  { label: 'Location', slot: 'location', disabled: true },
]
</script>

<template>
  <div class="p-4">
    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="asset">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">{{ (asset as any).assetNumber }}</h1>
          <p class="text-gray-500">{{ (asset as any).year }} {{ (asset as any).make }} {{ (asset as any).model }}</p>
        </div>
        <div class="flex gap-2">
          <UBadge :color="(asset as any).status === 'active' ? 'success' : 'neutral'" size="lg">
            {{ (asset as any).status }}
          </UBadge>
          <UButton icon="i-heroicons-pencil-square" color="neutral" variant="ghost">Edit</UButton>
        </div>
      </div>

      <UTabs :items="items" class="w-full">
        <template #overview>
          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">Asset Details</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">VIN</label>
                  <p>{{ (asset as any).vin || '-' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">License Plate</label>
                  <p>{{ (asset as any).licensePlate || '-' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Category</label>
                  <p>{{ (asset as any).categoryName || '-' }}</p> 
                </div>
              </div>
              <div class="space-y-4">
                 <div>
                  <label class="block text-sm font-medium text-gray-500">Current Mileage</label>
                  <p>{{ (asset as any).currentMileage }} km</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Current Hours</label>
                  <p>{{ (asset as any).currentHours }} hrs</p>
                </div>
              </div>
            </div>
          </UCard>
        </template>
        
        <template #work-orders>
          <div class="p-4 text-center text-gray-500">Work Orders module coming soon</div>
        </template>
      </UTabs>
    </div>
    <div v-else class="text-center p-8">
      <p class="text-red-500">Asset not found</p>
      <UButton to="/assets" color="neutral" variant="ghost" class="mt-4">Back to Assets</UButton>
    </div>
  </div>
</template>