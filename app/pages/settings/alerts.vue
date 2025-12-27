<script setup lang="ts">
const toast = useToast()

const { data: _rules, refresh } = await useFetch('/api/settings/alerts/rules')

const _isModalOpen = ref(false)
const _isSaving = ref(false)
const _selectedRule = ref<any>(null)

const _defaultRule = {
  name: '',
  description: '',
  condition: { field: 'odometer', operator: '>', value: 100000 },
  recipients: { userIds: [] },
  channels: ['inApp'],
  isActive: true
}

const _state = ref({ ..._defaultRule })

const _fields = [
  { label: 'Odometer', value: 'odometer' },
  { label: 'Engine Hours', value: 'engineHours' },
  { label: 'Fuel Level', value: 'fuelLevel' },
  { label: 'Idle Time', value: 'idleTime' }
]

const _operators = [
  { label: 'Greater than', value: '>' },
  { label: 'Less than', value: '<' },
  { label: 'Equals', value: '=' }
]

const _channels = [
  { label: 'In-App', value: 'inApp' },
  { label: 'Push', value: 'push' },
  { label: 'Email', value: 'email' }
]

function _openCreateModal() {
  _selectedRule.value = null
  _state.value = { ..._defaultRule, condition: { ..._defaultRule.condition }, recipients: { ..._defaultRule.recipients }, channels: [..._defaultRule.channels] }
  _isModalOpen.value = true
}

function _openEditModal(rule: any) {
  _selectedRule.value = rule
  _state.value = JSON.parse(JSON.stringify(rule))
  _isModalOpen.value = true
}

async function _saveRule() {
  _isSaving.value = true
  try {
    if (_selectedRule.value) {
      await $fetch(`/api/settings/alerts/rules/${_selectedRule.value.id}`, {
        method: 'PUT',
        body: _state.value
      })
    } else {
      await $fetch('/api/settings/alerts/rules', {
        method: 'POST',
        body: _state.value
      })
    }
    toast.add({ title: 'Alert rule saved', color: 'success' })
    _isModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save alert rule', color: 'error' })
  } finally {
    _isSaving.value = false
  }
}

async function _deleteRule(id: string) {
  if (!confirm('Are you sure you want to delete this alert rule?')) return
  
  try {
    await $fetch(`/api/settings/alerts/rules/${id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Alert rule deleted', color: 'success' })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to delete alert rule', color: 'error' })
  }
}

async function _toggleRuleStatus(rule: any) {
  try {
    await $fetch(`/api/settings/alerts/rules/${rule.id}`, {
      method: 'PUT',
      body: { ...rule, isActive: !rule.isActive }
    })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to update rule status', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Alert Rules"
      description="Configure custom rules to trigger alerts based on asset conditions."
      variant="naked"
    >
      <template #right>
        <UButton
          label="New Rule"
          icon="i-lucide-plus"
          @click="_openCreateModal"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ body: 'p-0' }">
      <UTable
        :rows="_rules || []"
        :columns="[
          { key: 'name', label: 'Name' },
          { key: 'condition', label: 'Condition' },
          { key: 'channels', label: 'Channels' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '' }
        ]"
      >
        <template #name-data="{ row }">
          <div class="font-medium text-highlighted">{{ row.name }}</div>
          <div class="text-xs text-dimmed">{{ row.description }}</div>
        </template>

        <template #condition-data="{ row }">
          <div class="text-sm">
            {{ row.condition.field }} {{ row.condition.operator }} {{ row.condition.value }}
          </div>
        </template>

        <template #channels-data="{ row }">
          <div class="flex gap-1">
            <UBadge v-for="channel in row.channels" :key="channel" size="xs" variant="subtle">
              {{ channel }}
            </UBadge>
          </div>
        </template>

        <template #status-data="{ row }">
          <USwitch
            :model-value="row.isActive"
            @update:model-value="_toggleRuleStatus(row)"
          />
        </template>

        <template #actions-data="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="_openEditModal(row)"
            />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="xs"
              @click="_deleteRule(row.id)"
            />
          </div>
        </template>
      </UTable>
    </UPageCard>

    <UModal v-model:open="_isModalOpen" title="Alert Rule">
      <template #body>
        <UForm :state="_state" class="space-y-4" @submit="_saveRule">
          <UFormField label="Rule Name" required>
            <UInput v-model="_state.name" placeholder="e.g. High Mileage Alert" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="_state.description" placeholder="Optional description..." />
          </UFormField>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Field">
              <USelect v-model="_state.condition.field" :options="_fields" />
            </UFormField>
            <UFormField label="Operator">
              <USelect v-model="_state.condition.operator" :options="_operators" />
            </UFormField>
            <UFormField label="Value">
              <UInput v-model.number="_state.condition.value" type="number" />
            </UFormField>
          </div>

          <UFormField label="Notification Channels">
            <div class="flex gap-4">
              <UCheckbox
                v-for="channel in _channels"
                :key="channel.value"
                v-model="_state.channels"
                :label="channel.label"
                :value="channel.value"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              @click="_isModalOpen = false"
            />
            <UButton
              type="submit"
              label="Save Rule"
              :loading="_isSaving"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
