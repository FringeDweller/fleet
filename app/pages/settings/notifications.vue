<script setup lang="ts">
const toast = useToast()

const { data: prefs, refresh } = await useFetch<any>('/api/settings/notifications')

const state = ref({
  preferences: (prefs.value?.preferences || {}) as Record<string, any>,
  quietHours: prefs.value?.quietHours || { enabled: false, start: '22:00', end: '07:00' }
})

const eventTypes = [
  {
    key: 'maintenance_due',
    label: 'Maintenance Due',
    description: 'When an asset maintenance schedule is due.'
  },
  {
    key: 'inspection_failed',
    label: 'Inspection Failed',
    description: 'When a pre-start inspection has critical failures.'
  },
  {
    key: 'low_stock',
    label: 'Low Stock Alert',
    description: 'When inventory parts fall below threshold.'
  },
  {
    key: 'geofence_entry',
    label: 'Geofence Entry',
    description: 'When an asset enters a restricted zone.'
  },
  {
    key: 'geofence_exit',
    label: 'Geofence Exit',
    description: 'When an asset leaves a designated zone.'
  }
]

const isSaving = ref(false)

async function savePreferences() {
  isSaving.value = true
  try {
    await $fetch('/api/settings/notifications', {
      method: 'PUT',
      body: state.value
    })
    toast.add({ title: 'Preferences saved', color: 'success' })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save preferences', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

function toggleChannel(eventKey: string, channel: 'inApp' | 'push' | 'email') {
  if (!state.value.preferences[eventKey]) {
    state.value.preferences[eventKey] = { inApp: false, push: false, email: false }
  }
  state.value.preferences[eventKey][channel] = !state.value.preferences[eventKey][channel]
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Notification Preferences"
      description="Configure how and when you want to be notified."
      variant="naked"
    >
      <template #right>
        <UButton
          label="Save Changes"
          :loading="isSaving"
          @click="savePreferences"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-default">
              <th class="py-3 font-semibold text-highlighted">Event Type</th>
              <th class="py-3 font-semibold text-highlighted text-center">In-App</th>
              <th class="py-3 font-semibold text-highlighted text-center">Push</th>
              <th class="py-3 font-semibold text-highlighted text-center">Email</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="event in eventTypes" :key="event.key">
              <td class="py-4">
                <div class="font-medium text-highlighted">{{ event.label }}</div>
                <div class="text-xs text-dimmed">{{ event.description }}</div>
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="state.preferences[event.key]?.inApp"
                  class="inline-flex"
                  @update:model-value="toggleChannel(event.key, 'inApp')"
                />
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="state.preferences[event.key]?.push"
                  class="inline-flex"
                  @update:model-value="toggleChannel(event.key, 'push')"
                />
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="state.preferences[event.key]?.email"
                  class="inline-flex"
                  @update:model-value="toggleChannel(event.key, 'email')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UPageCard>

    <UPageCard
      title="Quiet Hours"
      description="Suppress push notifications during these hours."
      variant="naked"
    />

    <UPageCard variant="subtle">
      <div class="space-y-4">
        <UFormField label="Enable Quiet Hours" description="Turn off push notifications during a specific time.">
          <USwitch v-model="state.quietHours.enabled" />
        </UFormField>

        <div v-if="state.quietHours.enabled" class="grid grid-cols-2 gap-4">
          <UFormField label="Start Time">
            <UInput v-model="state.quietHours.start" type="time" />
          </UFormField>
          <UFormField label="End Time">
            <UInput v-model="state.quietHours.end" type="time" />
          </UFormField>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
