const { data: _lowStockParts, pending: _pending } = await useFetch('/api/inventory/parts', {
  query: { lowStock: 'true', limit: 5 }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-highlighted">Low Stock Alerts</h3>
        <UButton to="/inventory" variant="link" color="primary" size="xs">View All</UButton>
      </div>
    </template>

    <div v-if="_pending" class="space-y-3">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <div v-else-if="!_lowStockParts?.items || _lowStockParts.items.length === 0" class="text-center py-6 text-dimmed">
      All inventory levels healthy
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="part in (_lowStockParts.items as any[])"
        :key="part.id"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex flex-col">
          <span class="font-medium text-highlighted">{{ part.name }}</span>
          <span class="text-xs text-dimmed">SKU: {{ part.sku }}</span>
        </div>
        <div class="text-right">
          <UBadge color="error" variant="subtle" size="xs">
            {{ part.quantityOnHand }} {{ part.unit }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>
</template>
