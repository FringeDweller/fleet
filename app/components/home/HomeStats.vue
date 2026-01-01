<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

const baseStats = [
  {
    title: 'Total Assets',
    icon: 'i-lucide-truck',
    minValue: 50,
    maxValue: 100,
    minVariation: -5,
    maxVariation: 10,
    to: '/assets'
  },
  {
    title: 'Active Work Orders',
    icon: 'i-lucide-clipboard-list',
    minValue: 10,
    maxValue: 30,
    minVariation: -10,
    maxVariation: 20,
    to: '/work-orders'
  },
  {
    title: 'Overdue Maintenance',
    icon: 'i-lucide-calendar-alert',
    minValue: 2,
    maxValue: 10,
    minVariation: -20,
    maxVariation: 30,
    to: '/maintenance-schedules'
  },
  {
    title: 'Compliance Rate',
    icon: 'i-lucide-shield-check',
    minValue: 85,
    maxValue: 98,
    minVariation: -2,
    maxVariation: 5,
    formatter: (v: number) => `${v}%`,
    to: '/reports/compliance'
  }
]

const { data: _stats } = await useAsyncData<Stat[]>(
  'home-stats',
  async () => {
    return baseStats.map((stat) => {
      const value = randomInt(stat.minValue, stat.maxValue)
      const variation = randomInt(stat.minVariation, stat.maxVariation)

      return {
        title: stat.title,
        icon: stat.icon,
        value: stat.formatter ? stat.formatter(value) : value,
        variation,
        to: stat.to
      }
    })
  },
  {
    watch: [() => props.period, () => props.range],
    default: () => []
  }
)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard
      v-for="(stat, index) in _stats"
      :key="index"
      class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
      @click="navigateTo(stat.to)"
    >
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 rounded-full bg-primary/10 ring ring-inset ring-primary/25">
          <UIcon :name="stat.icon" class="size-5 text-primary" />
        </div>
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ stat.title }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-3xl font-bold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          size="xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UCard>
  </div>
</template>