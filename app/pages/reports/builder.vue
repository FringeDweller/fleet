<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()

const definition = ref({
  name: '',
  dataSource: 'assets',
  columns: [],
  filters: []
})

const _dataSources = [
  { label: 'Assets', value: 'assets' },
  { label: 'Work Orders', value: 'workOrders' },
  { label: 'Inspections', value: 'inspections' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Users', value: 'users' }
]

const _availableColumns = computed(() => {
  switch (definition.value.dataSource) {
    case 'assets':
      return [
        { label: 'Asset Number', value: 'assetNumber' },
        { label: 'VIN', value: 'vin' },
        { label: 'Make', value: 'make' },
        { label: 'Model', value: 'model' },
        { label: 'Year', value: 'year' },
        { label: 'Status', value: 'status' },
        { label: 'Current Mileage', value: 'currentMileage' },
        { label: 'Current Hours', value: 'currentHours' }
      ]
    case 'workOrders':
      return [
        { label: 'WO Number', value: 'woNumber' },
        { label: 'Description', value: 'description' },
        { label: 'Status', value: 'status' },
        { label: 'Priority', value: 'priority' },
        { label: 'Due Date', value: 'dueDate' },
        { label: 'Labor Cost', value: 'laborCost' },
        { label: 'Parts Cost', value: 'partsCost' },
        { label: 'Total Cost', value: 'totalCost' }
      ]
    case 'inspections':
      return [
        { label: 'Status', value: 'status' },
        { label: 'Start Time', value: 'startTime' },
        { label: 'End Time', value: 'endTime' }
      ]
    case 'inventory':
      return [
        { label: 'SKU', value: 'sku' },
        { label: 'Name', value: 'name' },
        { label: 'Unit', value: 'unit' },
        { label: 'Quantity On Hand', value: 'quantityOnHand' },
        { label: 'Unit Cost', value: 'unitCost' }
      ]
    case 'users':
      return [
        { label: 'First Name', value: 'firstName' },
        { label: 'Last Name', value: 'lastName' },
        { label: 'Email', value: 'email' },
        { label: 'Role', value: 'role' }
      ]
    default:
      return []
  }
})

const results = ref<Record<string, unknown>[]>([])
const isExecuting = ref(false)
const isSaving = ref(false)

async function _executeReport() {
  isExecuting.value = true
  try {
    results.value = await $fetch<Record<string, unknown>[]>('/api/reports/custom/execute', {
      method: 'POST',
      body: definition.value
    })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Failed to execute report', color: 'error' })
  } finally {
    isExecuting.value = false
  }
}

async function _saveReport() {
  if (!definition.value.name) {
    toast.add({ title: 'Report name is required', color: 'error' })
    return
  }
  isSaving.value = true
  try {
    await $fetch('/api/reports/custom', {
      method: 'POST',
      body: {
        name: definition.value.name,
        definition: definition.value
      }
    })
    toast.add({ title: 'Report saved successfully', color: 'success' })
    navigateTo('/reports')
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Failed to save report', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const _columns = computed(() => {
  if (results.value.length === 0 || !results.value[0]) return []

  return Object.keys(results.value[0]).map((key) => ({
    accessorKey: key,

    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }))
})
function _exportResults() {
  if (results.value.length === 0) return
  exportToCSV(
    results.value,
    _columns.value,
    `custom-report-${new Date().toISOString().split('T')[0]}`
  )
}
</script>

<template>
  <UDashboardPanel id="report-builder">
    <template #header>
      <UDashboardNavbar title="Custom Report Builder" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Run Report"
            icon="i-lucide-play"
            :loading="isExecuting"
            @click="_executeReport"
          />

          <UButton
            label="Save Report"
            icon="i-lucide-save"
            variant="soft"
            color="neutral"
            :loading="isSaving"
            @click="_saveReport"
          />

          <UButton
            v-if="results.length > 0"
            icon="i-lucide-download"
            label="Export"
            variant="soft"
            color="neutral"
            @click="_exportResults"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-12 gap-6 h-full overflow-hidden">
        <!-- Sidebar: Configuration -->

        <div class="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pb-20">
          <UFormField label="Report Name">
            <UInput v-model="definition.name" placeholder="Monthly Asset Usage" />
          </UFormField>

          <UFormField label="Data Source">
            <USelect
              v-model="definition.dataSource"
              :items="_dataSources"
              @change="definition.columns = []"
            />
          </UFormField>

          <UFormField label="Columns">
            <USelectMenu
              v-model="definition.columns"
              :items="_availableColumns"
              multiple
              placeholder="Select columns"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormField>

          <div class="pt-4 border-t border-default">
            <h4 class="text-sm font-bold mb-4">
              Filters
            </h4>

            <p class="text-xs text-dimmed italic">
              Dynamic filters coming soon...
            </p>
          </div>
        </div>

        <!-- Main: Results Preview -->

        <div class="col-span-12 lg:col-span-9 bg-elevated/25 rounded-lg border border-default overflow-hidden flex flex-col">
          <div class="p-4 border-b border-default bg-elevated/50 flex justify-between items-center text-sm font-medium">
            <span>Results Preview</span>

            <span v-if="results.length > 0" class="text-dimmed">{{ results.length }} rows found</span>
          </div>

          <div class="flex-1 overflow-auto">
            <UTable
              v-if="results.length > 0"
              :data="results"
              :columns="_columns as any[]"
            />

            <div v-else class="flex flex-col items-center justify-center h-full text-dimmed space-y-4">
              <UIcon name="i-lucide-table-properties" class="w-12 h-12 opacity-50" />

              <p>Configure your report and click Run to see results.</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
