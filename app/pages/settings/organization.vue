<script setup lang="ts">
const toast = useToast()

const { data: _org, refresh } = await useFetch('/api/settings/organization')

const _state = ref({
  name: _org.value?.name || '',
  address: _org.value?.address || '',
  logoUrl: _org.value?.logoUrl || '',
  settings: _org.value?.settings || {
    units: { distance: 'km', fuel: 'litres' },
    timezone: 'UTC'
  }
})

const _isSaving = ref(false)

async function _saveSettings() {
  _isSaving.value = true
  try {
    await $fetch('/api/settings/organization', {
      method: 'PUT',
      body: _state.value
    })
    toast.add({ title: 'Organisation settings saved', color: 'success' })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save settings', color: 'error' })
  } finally {
    _isSaving.value = false
  }
}

const _timezones = [
  'UTC', 'London/Europe', 'New_York/America', 'Sydney/Australia', 'Tokyo/Asia'
]
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Organisation Settings"
      description="Manage your company profile and system-wide defaults."
      variant="naked"
    >
      <template #right>
        <UButton
          label="Save Changes"
          :loading="_isSaving"
          @click="_saveSettings"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle" class="space-y-4">
      <UFormField label="Organisation Name" required>
        <UInput v-model="_state.name" placeholder="e.g. Acme Fleet" />
      </UFormField>

      <UFormField label="Address">
        <UTextarea v-model="_state.address" placeholder="Company address..." autoresize />
      </UFormField>

      <USeparator />

      <h3 class="text-sm font-bold text-highlighted mt-4 mb-2">System Defaults</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Distance Unit">
          <USelect v-model="_state.settings.units.distance" :options="['km', 'miles']" />
        </UFormField>
        <UFormField label="Fuel Unit">
          <USelect v-model="_state.settings.units.fuel" :options="['litres', 'gallons']" />
        </UFormField>
      </div>

      <UFormField label="Default Timezone">
        <USelect v-model="_state.settings.timezone" :options="_timezones" />
      </UFormField>
    </UPageCard>
  </div>
</template>
