<script setup lang="ts">
const { data: lowStockParts, pending } = await useFetch('/api/inventory/parts', {
  query: { lowStock: 'true', limit: 5 }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6">Low Stock Alerts</h3>
        <UButton to="/inventory" label="View All" color="neutral" variant="ghost" size="xs" />
      </div>
    </template>

    <div v-if="pending" class="space-y-2">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
    </div>
    <div v-else-if="!lowStockParts?.items.length" class="text-center py-4 text-neutral-500">
      All stock levels are healthy.
    </div>
    <div v-else class="divide-y divide-default">
      <div v-for="part in lowStockParts.items" :key="part.id" class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
        <div>
          <div class="font-medium">{{ part.name }}</div>
          <div class="text-sm text-neutral-500">{{ part.sku }}</div>
        </div>
        <div class="text-right">
          <div class="text-error-500 font-bold">{{ part.quantityOnHand }} {{ part.unit }}</div>
          <div class="text-xs text-neutral-400">Threshold: {{ part.reorderThreshold }}</div>
        </div>
      </div>
    </div>
  </UCard>
</template>
