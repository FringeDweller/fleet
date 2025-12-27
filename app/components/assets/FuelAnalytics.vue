<script setup lang="ts">
import type { FuelAnalytics, FuelTransaction } from '~/types'

const props = defineProps<{
  assetId: string
}>()

const { data: analytics, status: analyticsStatus } = await useFetch<FuelAnalytics>(
  '/api/fuel/analytics',
  {
    query: { assetId: props.assetId }
  }
)

const { data: _history, status: _historyStatus } = await useFetch<FuelTransaction[]>(
  '/api/fuel/history',
  {
    query: { assetId: props.assetId }
  }
)

const loadingAnalytics = computed(() => analyticsStatus.value === 'pending')
const loadingHistory = computed(() => _historyStatus.value === 'pending')

const stats = computed(() => {
  if (!analytics.value) return []

  return [
    {
      title: 'Avg Consumption',
      value: `${analytics.value.avgConsumption.toFixed(2)} L/100km`,
      icon: 'i-lucide-beaker'
    },
    {
      title: 'Avg Cost per km',
      value: `$${analytics.value.avgCostPerKm.toFixed(2)}`,
      icon: 'i-lucide-dollar-sign'
    },
    {
      title: 'Total Fuel',
      value: `${analytics.value.totalLitres.toFixed(0)} L`,
      icon: 'i-lucide-fuel'
    },
    {
      title: 'Total Cost',
      value: `$${analytics.value.totalCost.toFixed(2)}`,
      icon: 'i-lucide-credit-card'
    }
  ]
})

const _columns = [
  { key: 'transactionDate', label: 'Date' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'totalCost', label: 'Cost' },
  { key: 'odometer', label: 'Odometer' },
  { key: 'fuelType', label: 'Fuel Type' },
  { key: 'stationName', label: 'Station' }
]
</script>

<template>
  <div class="space-y-6 mt-4">
    <div v-if="loadingAnalytics" class="flex justify-center p-8">
      <UIcon name="i-lucide-refresh-cw" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="analytics">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard v-for="stat in stats" :key="stat.title" class="flex-1">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <UIcon :name="stat.icon" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-sm text-dimmed">
                {{ stat.title }}
              </p>
              <p class="text-xl font-bold text-highlighted">
                {{ stat.value }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UAlert
        v-if="analytics.anomalies && analytics.anomalies.length > 0"
        icon="i-lucide-triangle-alert"
        color="error"
        variant="subtle"
        title="Fuel Anomalies Detected"
        :description="`${analytics.anomalies.length} transactions show unusually high fuel consumption.`"
        class="mt-6"
      />

      <UCard v-if="analytics.trends && analytics.trends.length > 0" class="mt-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            Consumption Trends (L/100km)
          </h3>
        </template>
        <div class="h-64 flex items-end gap-2 px-4 pb-8">
          <div
            v-for="(trend, i) in analytics.trends"
            :key="i"
            class="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t relative group"
            :style="{ height: `${(trend.consumption / (Math.max(...analytics.trends.map(t => t.consumption)) || 1)) * 100}%` }"
          >
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {{ new Date(trend.date).toLocaleDateString() }}
            </div>
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {{ trend.consumption.toFixed(1) }}
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="mt-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Fuel History
          </h3>
          <UButton
            icon="i-lucide-plus"
            size="xs"
            color="primary"
            label="Record Fuel"
            disabled
          />
        </div>
      </template>

      <div v-if="loadingHistory" class="flex justify-center py-8">
        <UIcon name="i-lucide-refresh-cw" class="w-8 h-8 animate-spin text-dimmed" />
      </div>
      <div v-else-if="!_history || _history.length === 0" class="text-center py-8 text-dimmed">
        No fuel transactions found
      </div>
      <div v-else class="space-y-4">
        <div v-for="tx in _history" :key="tx.id" class="flex justify-between items-center text-sm border-b border-elevated pb-2">
          <div>
            <div class="font-medium text-highlighted">{{ new Date(tx.transactionDate).toLocaleDateString() }}</div>
            <div class="text-xs text-dimmed">{{ tx.fuelType }} @ {{ tx.stationName || 'Unknown Station' }}</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-primary">{{ tx.totalCost }}</div>
            <div class="text-xs text-dimmed">{{ tx.quantity }} L</div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>