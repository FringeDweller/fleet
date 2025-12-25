<script setup lang="ts">
const { data: fuelAnomalies, pending } = await useFetch<{
  id: string
  assetId: string
  assetNumber: string
  message: string
  createdAt: string
  consumption: number
  percentageAboveAvg: number
}[]>('/api/fuel/anomalies')
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          Fuel Consumption Anomalies
        </h3>
        <UBadge v-if="fuelAnomalies?.length" color="error" variant="subtle">
          {{ fuelAnomalies.length }} urgent
        </UBadge>
      </div>
    </template>

    <div v-if="pending" class="flex justify-center p-4">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
    </div>
    <div v-else-if="fuelAnomalies?.length === 0" class="text-center p-4 text-gray-500">
      No recent fuel anomalies detected.
    </div>
    <div v-else class="space-y-4">
      <div v-for="anomaly in fuelAnomalies" :key="anomaly.id" class="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
        <div class="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-red-900 dark:text-red-100 truncate">
            {{ anomaly.assetNumber }}
          </p>
          <p class="text-xs text-red-700 dark:text-red-300">
            {{ anomaly.consumption.toFixed(1) }} L/100km ({{ anomaly.percentageAboveAvg.toFixed(0) }}% above avg)
          </p>
        </div>
        <UButton
          :to="`/assets/${anomaly.assetId}?tab=fuel`"
          size="xs"
          color="error"
          variant="ghost"
          icon="i-heroicons-arrow-right"
        />
      </div>
    </div>
  </UCard>
</template>
