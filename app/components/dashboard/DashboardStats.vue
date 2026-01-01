<script setup lang="ts">
import type { Range, Stat } from '~/types'

const props = defineProps<{
  range: Range
}>()

const {
  data: _stats,
  status,
  refresh: _refresh
} = await useAsyncData(
  'dashboard-stats',
  () => {
    const params = new URLSearchParams()
    if (props.range?.start) params.append('start', props.range.start.toISOString())
    if (props.range?.end) params.append('end', props.range.end.toISOString())
    return $fetch<Stat[]>(`/api/dashboard/stats?${params.toString()}`)
  },
  {
    watch: [() => props.range]
  }
)

const loading = computed(() => status.value === 'pending')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <template v-if="loading && (!_stats || _stats.length === 0)">
      <UCard
        v-for="i in 4"
        :key="i"
      >
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-full" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-6 w-16" />
          </div>
        </div>
      </UCard>
    </template>

    <template v-else>
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
            v-if="stat.variation !== 0"
            :color="stat.inverseTrend ? (stat.variation > 0 ? 'error' : 'success') : (stat.variation > 0 ? 'success' : 'error')"
            variant="subtle"
            size="xs"
          >
            {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
          </UBadge>
        </div>
      </UCard>
    </template>
  </div>
</template>