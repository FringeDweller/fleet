<script setup lang="ts">
const toast = useToast()

const { data: _prefs, refresh } = await useFetch('/api/settings/notifications')

const _state = ref({
  preferences: _prefs.value?.preferences || {},
  quietHours: _prefs.value?.quietHours || { enabled: false, start: '22:00', end: '07:00' }
})

const _eventTypes = [
  { key: 'maintenance_due', label: 'Maintenance Due', description: 'When an asset maintenance schedule is due.' },
  { key: 'inspection_failed', label: 'Inspection Failed', description: 'When a pre-start inspection has critical failures.' },
  { key: 'low_stock', label: 'Low Stock Alert', description: 'When inventory parts fall below threshold.' },
  { key: 'geofence_entry', label: 'Geofence Entry', description: 'When an asset enters a restricted zone.' },
  { key: 'geofence_exit', label: 'Geofence Exit', description: 'When an asset leaves a designated zone.' }
]

const _isSaving = ref(false)

async function _savePreferences() {
  _isSaving.value = true
  try {
    await $fetch('/api/settings/notifications', {
      method: 'PUT',
      body: _state.value
    })
    toast.add({ title: 'Preferences saved', color: 'success' })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save preferences', color: 'error' })
  } finally {
    _isSaving.value = false
  }
}

function _toggleChannel(eventKey: string, channel: 'inApp' | 'push' | 'email') {
  if (!_state.value.preferences[eventKey]) {
    _state.value.preferences[eventKey] = { inApp: false, push: false, email: false }
  }
  _state.value.preferences[eventKey][channel] = !_state.value.preferences[eventKey][channel]
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
          :loading="_isSaving"
          @click="_savePreferences"
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
            <tr v-for="event in _eventTypes" :key="event.key">
              <td class="py-4">
                <div class="font-medium text-highlighted">{{ event.label }}</div>
                <div class="text-xs text-dimmed">{{ event.description }}</div>
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="_state.preferences[event.key]?.inApp"
                  class="inline-flex"
                  @update:model-value="_toggleChannel(event.key, 'inApp')"
                />
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="_state.preferences[event.key]?.push"
                  class="inline-flex"
                  @update:model-value="_toggleChannel(event.key, 'push')"
                />
              </td>
              <td class="py-4 text-center">
                <UCheckbox
                  :model-value="_state.preferences[event.key]?.email"
                  class="inline-flex"
                  @update:model-value="_toggleChannel(event.key, 'email')"
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
          <USwitch v-model="_state.quietHours.enabled" />
        </UFormField>

        <div v-if="_state.quietHours.enabled" class="grid grid-cols-2 gap-4">
          <UFormField label="Start Time">
            <UInput v-model="_state.quietHours.start" type="time" />
          </UFormField>
          <UFormField label="End Time">
            <UInput v-model="_state.quietHours.end" type="time" />
          </UFormField>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
