<script setup lang="ts">
import type { Notification } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: notifications } = await useFetch<Notification[]>('/api/notifications')
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <NuxtLink
        v-for="notification in notifications"
        :key="notification.id"
        :to="notification.link || '#'"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
      >
        <UChip
          :color="notification.type === 'error' ? 'error' : (notification.type === 'warning' ? 'warning' : 'primary')"
          :show="!notification.isRead"
          inset
        >
          <UAvatar
            :icon="notification.type === 'warning' ? 'i-heroicons-exclamation-triangle' : (notification.type === 'error' ? 'i-heroicons-x-circle' : 'i-heroicons-information-circle')"
            size="md"
          />
        </UChip>

        <div class="text-sm flex-1">
          <p class="flex items-center justify-between">
            <span class="text-highlighted font-medium">{{ notification.title }}</span>

            <time
              :datetime="notification.createdAt"
              class="text-muted text-xs"
              v-text="formatTimeAgo(new Date(notification.createdAt))"
            />
          </p>

          <p class="text-dimmed">
            {{ notification.message }}
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
