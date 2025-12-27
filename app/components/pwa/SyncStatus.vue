<script setup lang="ts">
const { syncing, getQueue, sync: _sync } = useOfflineSync()
const _online = useOnline()

const queueCount = ref(0)

const updateQueueCount = async () => {
  const queue = await getQueue()
  queueCount.value = queue.length
}

onMounted(() => {
  updateQueueCount()
  // Refresh count every 5 seconds if not syncing
  setInterval(() => {
    if (!syncing.value) updateQueueCount()
  }, 5000)
})

watch(syncing, (isSyncing) => {
  if (!isSyncing) updateQueueCount()
})
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors"
    :class="[
      online ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    ]"
  >
    <UIcon :name="syncing ? 'i-lucide-refresh-cw animate-spin' : online ? 'i-lucide-wifi' : 'i-lucide-wifi-off'" />
    <span>{{ online ? (syncing ? 'Syncing...' : 'Online') : 'Offline' }}</span>
    <span v-if="queueCount > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/50">
      {{ queueCount }} pending
    </span>
    <UButton
      v-if="queueCount > 0 && online && !syncing"
      variant="ghost"
      size="xs"
      icon="i-lucide-upload"
      class="ml-1 -my-1 h-6 w-6"
      @click="sync"
    />
  </div>
</template>
