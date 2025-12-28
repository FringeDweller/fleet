<script setup lang="ts">
import type { Range, Stat } from '~/types'

const props = defineProps<{
  range: Range
}>()

const {
  data: _stats,
  status,
  refresh
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
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <template v-if="loading && (!_stats || _stats.length === 0)">
      <UPageCard
        v-for="i in 4"
        :key="i"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg"
      >
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-full" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-6 w-16" />
          </div>
        </div>
      </UPageCard>
    </template>

    <template v-else>
      <UPageCard
        v-for="(stat, index) in _stats"
        :key="index"
        :icon="stat.icon"
        :title="stat.title"
        :to="stat.to"
        variant="subtle"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase'
        }"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      >
        <div class="flex items-center gap-2">
          <span class="text-2xl font-semibold text-highlighted">
            {{ stat.value }}
          </span>

          <UBadge
            v-if="stat.variation !== 0"
            :color="stat.inverseTrend ? (stat.variation > 0 ? 'error' : 'success') : (stat.variation > 0 ? 'success' : 'error')"
            variant="subtle"
            class="text-xs"
          >
            {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
          </UBadge>
        </div>
      </UPageCard>
    </template>
  </UPageGrid>
</template>
