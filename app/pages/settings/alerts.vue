<script setup lang="ts">
const toast = useToast()

const { data: rules, refresh } = await useFetch<any[]>('/api/settings/alerts/rules')

const isModalOpen = ref(false)
const isSaving = ref(false)
const selectedRule = ref<any>(null)

const defaultRule = {
  name: '',
  description: '',
  condition: { field: 'odometer', operator: '>', value: 100000 },
  recipients: { userIds: [] },
  channels: ['inApp'],
  isActive: true
}

const state = ref({ ...defaultRule })

const fields = [
  { label: 'Odometer', value: 'odometer' },
  { label: 'Engine Hours', value: 'engineHours' },
  { label: 'Fuel Level', value: 'fuelLevel' },
  { label: 'Idle Time', value: 'idleTime' }
]

const operators = [
  { label: 'Greater than', value: '>' },
  { label: 'Less than', value: '<' },
  { label: 'Equals', value: '=' }
]

const channels = [
  { label: 'In-App', value: 'inApp' },
  { label: 'Push', value: 'push' },
  { label: 'Email', value: 'email' }
]

function openCreateModal() {
  selectedRule.value = null
  state.value = {
    ...defaultRule,
    condition: { ...defaultRule.condition },
    recipients: { ...defaultRule.recipients },
    channels: [...defaultRule.channels]
  }
  isModalOpen.value = true
}

function openEditModal(rule: any) {
  selectedRule.value = rule
  state.value = JSON.parse(JSON.stringify(rule))
  isModalOpen.value = true
}

async function saveRule() {
  isSaving.value = true
  try {
    if (selectedRule.value) {
      await $fetch(`/api/settings/alerts/rules/${selectedRule.value.id}`, {
        method: 'PUT',
        body: state.value
      })
    } else {
      await $fetch('/api/settings/alerts/rules', {
        method: 'POST',
        body: state.value
      })
    }
    toast.add({ title: 'Alert rule saved', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save alert rule', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function deleteRule(id: string) {
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

async function toggleRuleStatus(rule: any) {
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

function toggleChannel(value: string) {
  const index = state.value.channels.indexOf(value)
  if (index === -1) {
    state.value.channels.push(value)
  } else {
    state.value.channels.splice(index, 1)
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
          @click="openCreateModal"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ body: 'p-0' }">
      <UTable
        :data="rules || []"
        :columns="[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'condition', header: 'Condition' },
          { accessorKey: 'channels', header: 'Channels' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'actions', header: '' }
        ]"
      >
        <template #name-cell="{ row }">
          <div class="font-medium text-highlighted">{{ row.original.name }}</div>
          <div class="text-xs text-dimmed">{{ row.original.description }}</div>
        </template>

        <template #condition-cell="{ row }">
          <div class="text-sm">
            {{ row.original.condition.field }} {{ row.original.condition.operator }} {{ row.original.condition.value }}
          </div>
        </template>

        <template #channels-cell="{ row }">
          <div class="flex gap-1">
            <UBadge v-for="channel in row.original.channels" :key="channel" size="xs" variant="subtle">
              {{ channel }}
            </UBadge>
          </div>
        </template>

        <template #status-cell="{ row }">
          <USwitch
            :model-value="row.original.isActive"
            @update:model-value="toggleRuleStatus(row.original)"
          />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="xs"
              @click="deleteRule(row.original.id)"
            />
          </div>
        </template>
      </UTable>
    </UPageCard>

    <UModal v-model:open="isModalOpen" title="Alert Rule">
      <template #body>
        <UForm :state="state" class="space-y-4" @submit="saveRule">
          <UFormField label="Rule Name" required>
            <UInput v-model="state.name" placeholder="e.g. High Mileage Alert" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="state.description" placeholder="Optional description..." />
          </UFormField>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Field">
              <USelect v-model="state.condition.field" :options="fields" />
            </UFormField>
            <UFormField label="Operator">
              <USelect v-model="state.condition.operator" :options="operators" />
            </UFormField>
            <UFormField label="Value">
              <UInput v-model.number="state.condition.value" type="number" />
            </UFormField>
          </div>

          <UFormField label="Notification Channels">
            <div class="flex gap-4">
              <UCheckbox
                v-for="channel in channels"
                :key="channel.value"
                :model-value="state.channels.includes(channel.value)"
                :label="channel.label"
                @update:model-value="() => toggleChannel(channel.value)"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              @click="isModalOpen = false"
            />
            <UButton
              type="submit"
              label="Save Rule"
              :loading="isSaving"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
