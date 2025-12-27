const { data: _fuelAnomalies, pending: _pending } =
  await useFetch<
    {
      id: string
      assetName: string
      date: string
      consumption: number
      average: number
      deviation: number
    }[]
  >('/api/fuel/anomalies')
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-highlighted">Fuel Anomalies</h3>
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-warning" />
      </div>
    </template>

    <div v-if="_pending" class="space-y-3">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
    </div>

    <div v-else-if="!_fuelAnomalies || _fuelAnomalies.length === 0" class="text-center py-6 text-dimmed">
      No fuel anomalies detected
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="anomaly in _fuelAnomalies"
        :key="anomaly.id"
        class="flex items-center justify-between p-3 border border-elevated rounded-md"
      >
        <div>
          <div class="text-sm font-medium text-highlighted">{{ anomaly.assetName }}</div>
          <div class="text-xs text-dimmed">{{ format(new Date(anomaly.date), 'PPP') }}</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-error">+{{ anomaly.deviation }}%</div>
          <div class="text-xs text-dimmed">{{ anomaly.consumption }}L vs {{ anomaly.average }}L avg</div>
        </div>
      </div>
    </div>
  </UCard>
</template>
