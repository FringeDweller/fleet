<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: report, pending: loadingReport } = await useFetch<any>(`/api/reports/custom/${id}`)

const results = ref<Record<string, unknown>[]>([])
const isExecuting = ref(false)

const definition = computed(() => report.value?.definition || {})

async function _executeReport() {
  if (!definition.value) return
  
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

// Auto-run on load
watch(report, (newReport) => {
  if (newReport) {
    _executeReport()
  }
}, { immediate: true })

const _columns = computed(() => {
  if (results.value.length === 0 || !results.value[0]) return []

  // If columns are defined in the definition, use them (and their order)
  // Otherwise fall back to all keys in the result
  if (definition.value?.columns && definition.value.columns.length > 0) {
     return definition.value.columns.map((col: string) => ({
       key: col,
       label: col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')
     }))
  }

  return Object.keys(results.value[0]).map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }))
})

function _exportResults() {
  if (results.value.length === 0) return
  exportToCSV(
    results.value,
    _columns.value,
    `${report.value?.name || 'custom-report'}-${new Date().toISOString().split('T')[0]}`
  )
}
</script>

<template>
  <UDashboardPanel :id="`custom-report-${id}`">
    <template #header>
      <UDashboardNavbar :title="report?.name || 'Loading...'" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="gray"
            to="/reports"
          />
        </template>

        <template #right>
          <UButton
            label="Refresh"
            icon="i-lucide-refresh-cw"
            variant="soft"
            color="neutral"
            :loading="isExecuting"
            @click="_executeReport"
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
      <div class="h-full flex flex-col">
        <div v-if="loadingReport" class="p-6 text-center text-dimmed">
          Loading report definition...
        </div>
        
        <div v-else-if="!report" class="p-6 text-center text-error">
          Report not found.
        </div>

        <div v-else class="flex-1 overflow-auto p-4">
           <div v-if="results.length > 0">
             <div class="mb-4 text-sm text-dimmed flex justify-between">
                <span>{{ results.length }} rows found</span>
                <span>Source: {{ definition.dataSource }}</span>
             </div>
             <UTable
              :data="results"
              :columns="_columns"
            />
           </div>

           <div v-else-if="isExecuting" class="flex flex-col items-center justify-center h-full text-dimmed space-y-4">
              <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin" />
              <p>Generating report...</p>
           </div>
           
           <div v-else class="flex flex-col items-center justify-center h-full text-dimmed space-y-4">
              <UIcon name="i-lucide-search-x" class="w-12 h-12 opacity-50" />
              <p>No results found for this report configuration.</p>
           </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
