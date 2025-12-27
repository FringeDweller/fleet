<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsSlideoverOpen: _isNotificationsSlideoverOpen } = useDashboard()
const { notifications: _notifications, markAsRead, markAllAsRead } = useNotifications()
</script>

<template>
  <USlideover
    v-model:open="_isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #header>
      <div class="flex items-center justify-between w-full pr-8">
        <h3 class="text-lg font-semibold text-highlighted">Notifications</h3>
        <UButton
          v-if="_notifications && _notifications.some(n => !n.isRead)"
          variant="ghost"
          color="primary"
          size="xs"
          label="Mark all as read"
          @click="markAllAsRead"
        />
      </div>
    </template>

    <template #body>
      <div v-if="!_notifications || _notifications.length === 0" class="text-center py-12 text-dimmed">
        <UIcon name="i-lucide-bell-off" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No new notifications</p>
      </div>
      <NuxtLink
        v-for="notification in _notifications"
        :key="notification.id"
        :to="notification.link || '#'"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
        @click="!notification.isRead && markAsRead(notification.id)"
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
            <span class="text-highlighted font-medium" :class="{ 'font-bold': !notification.isRead }">{{ notification.title }}</span>

            <time
              :datetime="notification.createdAt"
              class="text-muted text-xs"
              v-text="formatTimeAgo(new Date(notification.createdAt))"
            />
          </p>

          <p class="text-dimmed" :class="{ 'text-highlighted': !notification.isRead }">
            {{ notification.message }}
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
