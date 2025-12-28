<script setup lang="ts">
const toast = useToast()

const { data: _org, refresh } = await useFetch('/api/settings/organization')
const { data: _categories } = await useFetch('/api/assets/categories')

interface CertRule {
  categoryId: string
  requiredCert: string
}

interface OrganizationSettings {
  units: { distance: string; fuel: string }
  timezone: string
  maintenance: {
    defaultIntervalMonths: number
    defaultIntervalKm: number
    defaultIntervalHours: number
  }
  approvals: { workOrderThreshold: number }
  fuel: { anomalyThresholdPercent: number }
  preStart: { requirePhotos: boolean }
  certifications: CertRule[]
}

const _defaults: OrganizationSettings = {
  units: { distance: 'km', fuel: 'litres' },
  timezone: 'UTC',
  maintenance: { defaultIntervalMonths: 6, defaultIntervalKm: 10000, defaultIntervalHours: 500 },
  approvals: { workOrderThreshold: 1000 },
  fuel: { anomalyThresholdPercent: 10 },
  preStart: { requirePhotos: false },
  certifications: []
}

// Deep merge helper
const _currentSettings = (_org.value?.settings || {}) as unknown as Partial<OrganizationSettings>

const _settings: OrganizationSettings = {
  ..._defaults,
  ..._currentSettings,
  units: { ..._defaults.units, ...(_currentSettings.units || {}) },
  maintenance: { ..._defaults.maintenance, ...(_currentSettings.maintenance || {}) },
  approvals: { ..._defaults.approvals, ...(_currentSettings.approvals || {}) },
  fuel: { ..._defaults.fuel, ...(_currentSettings.fuel || {}) },
  preStart: { ..._defaults.preStart, ...(_currentSettings.preStart || {}) },
  certifications: _currentSettings.certifications || _defaults.certifications
}

const _state = ref({
  name: _org.value?.name || '',
  address: _org.value?.address || '',
  logoUrl: _org.value?.logoUrl || '',
  settings: _settings
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

const _timezones = ['UTC', 'London/Europe', 'New_York/America', 'Sydney/Australia', 'Tokyo/Asia']

// Certification Helpers
const newCertRule = ref({ categoryId: '', requiredCert: '' })
function addCertRule() {
  if (newCertRule.value.categoryId && newCertRule.value.requiredCert) {
    _state.value.settings.certifications.push({ ...newCertRule.value })
    newCertRule.value = { categoryId: '', requiredCert: '' }
  }
}
function removeCertRule(index: number) {
  _state.value.settings.certifications.splice(index, 1)
}

function getCategoryName(id: string) {
  return _categories.value?.find((c) => c.id === id)?.name || 'Unknown'
}
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

      <USeparator />

      <h3 class="text-sm font-bold text-highlighted mt-4 mb-2">Maintenance & Operations</h3>

      <div class="grid grid-cols-3 gap-4">
        <UFormField label="Default Interval (Months)">
           <UInput v-model.number="_state.settings.maintenance.defaultIntervalMonths" type="number" />
        </UFormField>
        <UFormField label="Default Interval (Distance)">
           <UInput v-model.number="_state.settings.maintenance.defaultIntervalKm" type="number">
             <template #trailing>
               <span class="text-gray-500 dark:text-gray-400 text-xs">{{ _state.settings.units.distance }}</span>
             </template>
           </UInput>
        </UFormField>
        <UFormField label="Default Interval (Hours)">
           <UInput v-model.number="_state.settings.maintenance.defaultIntervalHours" type="number">
             <template #trailing>
               <span class="text-gray-500 dark:text-gray-400 text-xs">hours</span>
             </template>
           </UInput>
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-4">
         <UFormField label="Work Order Approval Threshold ($)">
           <UInput v-model.number="_state.settings.approvals.workOrderThreshold" type="number">
             <template #leading>
               <span class="text-gray-500 dark:text-gray-400 text-xs">$</span>
             </template>
           </UInput>
        </UFormField>
         <UFormField label="Fuel Anomaly Threshold (%)">
           <UInput v-model.number="_state.settings.fuel.anomalyThresholdPercent" type="number">
             <template #trailing>
               <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
             </template>
           </UInput>
        </UFormField>
      </div>

       <UFormField label="Pre-Start Inspections" class="mt-4">
          <UCheckbox v-model="_state.settings.preStart.requirePhotos" label="Require photos for failed checks" />
       </UFormField>

      <USeparator />

      <h3 class="text-sm font-bold text-highlighted mt-4 mb-2">Certification Requirements</h3>
      <p class="text-xs text-muted mb-4">Define which certifications are required for operating specific asset categories.</p>

      <div class="space-y-2 mb-4">
        <div v-for="(rule, index) in _state.settings.certifications" :key="index" class="flex items-center gap-2 p-2 border rounded-md">
           <div class="flex-1 text-sm">
             <span class="font-medium">{{ getCategoryName(rule.categoryId) }}</span> requires <span class="font-medium">{{ rule.requiredCert }}</span>
           </div>
           <UButton icon="i-lucide-trash" color="error" variant="ghost" size="xs" @click="removeCertRule(index)" />
        </div>
        <div v-if="_state.settings.certifications.length === 0" class="text-sm text-muted italic">No rules defined.</div>
      </div>

      <div class="flex items-end gap-2">
         <UFormField label="Asset Category" class="flex-1">
            <USelect 
              v-model="newCertRule.categoryId" 
              :options="_categories || []" 
              option-attribute="name" 
              value-attribute="id"
              placeholder="Select category"
            />
         </UFormField>
         <UFormField label="Required Certification" class="flex-1">
            <UInput v-model="newCertRule.requiredCert" placeholder="e.g. Heavy Rigid License" />
         </UFormField>
         <UButton label="Add Rule" @click="addCertRule" color="neutral" variant="soft" />
      </div>

    </UPageCard>
  </div>
</template>
