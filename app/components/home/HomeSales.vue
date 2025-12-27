<script setup lang="ts">
const items = [
  {
    user: 'James Anderson',
    avatar: 'https://i.pravatar.cc/150?u=james',
    action: 'Logged on to Asset #102',
    time: '2m ago'
  },
  {
    user: 'Mia White',
    avatar: 'https://i.pravatar.cc/150?u=mia',
    action: 'Completed Inspection for Asset #405',
    time: '15m ago'
  },
  {
    user: 'William Brown',
    avatar: 'https://i.pravatar.cc/150?u=william',
    action: 'Recorded Fuel for Asset #201',
    time: '1h ago'
  }
]

const { data: _data } = await useAsyncData('sales', async () => {
  // Mock data for now
  return items
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-highlighted">Recent Activity</h3>
        <UButton variant="link" color="primary" size="xs">View All</UButton>
      </div>
    </template>

    <div class="space-y-4">
      <div v-for="item in _data" :key="item.user" class="flex items-center gap-3">
        <UAvatar :src="item.avatar" :alt="item.user" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">{{ item.user }}</p>
          <p class="text-xs text-dimmed truncate">{{ item.action }}</p>
        </div>
        <div class="text-xs text-dimmed whitespace-nowrap">{{ item.time }}</div>
      </div>
    </div>
  </UCard>
</template>