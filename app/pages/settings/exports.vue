<script setup lang="ts">
const toast = useToast()

const types = [
  { label: 'Assets', value: 'assets' },
  { label: 'Work Orders', value: 'workOrders' },
  { label: 'Inspections', value: 'inspections' },
  { label: 'Inventory', value: 'inventory' }
]

const selectedType = ref('assets')
const searchQuery = ref('')
const availableFields = ref<{ key: string, label: string }[]>([])
const selectedFields = ref<string[]>([])
const isExporting = ref(false)
const isScheduling = ref(false)
const scheduledExports = ref<any[]>([])

const scheduleOptions = [
  { label: 'Daily', value: '0 0 * * *' },
  { label: 'Weekly', value: '0 0 * * 0' },
  { label: 'Monthly', value: '0 0 1 * *' }
]
const selectedSchedule = ref('0 0 * * *')
const exportName = ref('')

async function fetchFields() {
  try {
    const fields = await $fetch<{ key: string, label: string }[]>(`/api/settings/exports/fields?type=${selectedType.value}`)
    availableFields.value = fields
    selectedFields.value = fields.map(f => f.key)
    exportName.value = `${selectedType.value} Export`
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Failed to fetch fields', color: 'error' })
  }
}

async function fetchScheduledExports() {
  try {
    scheduledExports.value = await $fetch<any[]>('/api/settings/exports/scheduled')
  } catch (err) {
    console.error(err)
  }
}

watch(selectedType, fetchFields, { immediate: true })
onMounted(fetchScheduledExports)

async function handleExport() {
  if (selectedFields.value.length === 0) {
    toast.add({ title: 'Please select at least one field', color: 'error' })
    return
  }

  isExporting.value = true
  try {
    const data = await $fetch<any[]>('/api/settings/exports/execute', {
      method: 'POST',
      body: {
        type: selectedType.value,
        columns: selectedFields.value,
        filters: {
          q: searchQuery.value
        }
      }
    })

    const columnsForCSV = availableFields.value
      .filter(f => selectedFields.value.includes(f.key))
      .map(f => ({ key: f.key, header: f.label }))

    exportToCSV(data, columnsForCSV, `${selectedType.value}-export-${new Date().toISOString().split('T')[0]}`)
    
    toast.add({ title: 'Export successful', color: 'success' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Export failed', color: 'error' })
  } finally {
    isExporting.value = false
  }
}

async function handleSchedule() {
  if (!exportName.value) {
    toast.add({ title: 'Please provide a name for the export', color: 'error' })
    return
  }

  isScheduling.value = true
  try {
    await $fetch('/api/settings/exports/scheduled', {
      method: 'POST',
      body: {
        name: exportName.value,
        entityType: selectedType.value,
        columns: selectedFields.value,
        filters: { q: searchQuery.value },
        schedule: selectedSchedule.value
      }
    })
    
    toast.add({ title: 'Export scheduled successfully', color: 'success' })
    fetchScheduledExports()
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Failed to schedule export', color: 'error' })
  } finally {
    isScheduling.value = false
  }
}

function toggleAll() {
  if (selectedFields.value.length === availableFields.value.length) {
    selectedFields.value = []
  } else {
    selectedFields.value = availableFields.value.map(f => f.key)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium">Data Export</h3>
      <p class="text-sm text-dimmed">Export your fleet data to CSV files.</p>
    </div>

    <UCard>
      <div class="space-y-4">
        <UFormField label="Entity Type">
          <USelect
            v-model="selectedType"
            :options="types"
          />
        </UFormField>

        <UFormField label="Filter by Keyword (Optional)">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search..."
          />
        </UFormField>

        <div v-if="availableFields.length > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Select Fields</label>
            <UButton 
              variant="ghost" 
              size="xs" 
              @click="toggleAll"
            >
              {{ selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All' }}
            </UButton>
          </div>
          
          <div class="border border-default p-4 rounded-lg">
            <UCheckboxGroup
              v-model="selectedFields"
              :options="availableFields.map(f => ({ value: f.key, label: f.label }))"
              class="grid grid-cols-2 md:grid-cols-3 gap-2"
            />
          </div>
        </div>

        <div class="pt-4 border-t border-default flex justify-end gap-3">
          <UButton
            label="Schedule Recurring"
            icon="i-lucide-calendar"
            variant="soft"
            color="neutral"
            @click="isScheduling = true"
          />
          <UButton
            label="Export to CSV"
            icon="i-lucide-download"
            :loading="isExporting"
            @click="handleExport"
          />
        </div>
      </div>
    </UCard>

    <UModal v-model="isScheduling">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6">
              Schedule Recurring Export
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isScheduling = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Export Name">
            <UInput v-model="exportName" placeholder="Weekly Asset Report" />
          </UFormField>

          <UFormField label="Frequency">
            <USelect v-model="selectedSchedule" :options="scheduleOptions" />
          </UFormField>

          <p class="text-xs text-dimmed">
            The export will be generated automatically and made available in the "Export History" (Coming Soon).
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="isScheduling = false" />
            <UButton label="Schedule" color="primary" @click="handleSchedule" />
          </div>
        </template>
      </UCard>
    </UModal>

    <UCard>
      <template #header>
        <h4 class="font-medium">Scheduled Exports</h4>
      </template>
      
      <div v-if="scheduledExports.length > 0">
        <UTable 
          :data="scheduledExports"
          :columns="[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'entityType', header: 'Type' },
            { accessorKey: 'schedule', header: 'Frequency' },
            { accessorKey: 'createdAt', header: 'Created' }
          ]"
        >
          <template #schedule-cell="{ row }">
            {{ scheduleOptions.find(o => o.value === row.original.schedule)?.label || row.original.schedule }}
          </template>
          <template #createdAt-cell="{ row }">
            {{ new Date(row.original.createdAt).toLocaleDateString() }}
          </template>
        </UTable>
      </div>
      <div v-else class="py-8 text-center text-dimmed italic">
        <UIcon name="i-lucide-calendar-clock" class="w-12 h-12 mx-auto opacity-50 mb-2" />
        <p>No scheduled exports found.</p>
      </div>
    </UCard>
  </div>
</template>
