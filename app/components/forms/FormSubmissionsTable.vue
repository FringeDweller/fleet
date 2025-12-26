<script setup lang="ts">
import type { FormField } from '../../../types/form-builder'

const props = defineProps<{
  formId: string
  schema: FormField[]
}>()

const { data: submissions } = await useFetch<any[]>(`/api/forms/submissions`, {
    query: { formId: props.formId }
})

const columns = computed(() => {
    const cols: { key: string; label: string }[] = [
        { key: 'createdAt', label: 'Date' },
        { key: 'targetModule', label: 'Module' },
        { key: 'submittedBy', label: 'User' }
    ]
    
    // Add first 3 fields from schema as columns
    if (props.schema) {
        props.schema.slice(0, 3).forEach((f) => {
            if (f.type !== 'section') {
                cols.push({ key: `data.${f.key}`, label: f.label })
            }
        })
    }
    
    cols.push({ key: 'actions', label: '' })
    return cols
})
function exportToCsv() {
  if (!submissions.value) return

  const headers = columns.value.map(c => c.label).join(',')
  const rows = submissions.value.map((sub) => {
    return columns.value.map((col) => {
      if (col.key === 'createdAt') return new Date(sub.createdAt).toLocaleString()
      if (col.key === 'targetModule') return sub.targetModule
      if (col.key === 'submittedBy') return sub.submittedBy
                  if (col.key.startsWith('data.')) {
                      const key = col.key.split('.')[1]
                      return `"${sub.data?.[key] || ''}"`
                  }
      
      return ''
    }).join(',')
  }).join('\n')

  const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `submissions_${props.formId}.csv`)
  document.body.appendChild(link)
  link.click()
}

const selectedSubmission = ref<any>(null)
const showModal = ref(false)

function viewDetail(sub: any) {
  selectedSubmission.value = sub
  showModal.value = true
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-bold">
        Submissions
      </h3>
      <UButton
        icon="i-lucide-download"
        label="Export CSV"
        variant="soft"
        @click="exportToCsv"
      />
    </div>

    <UTable :rows="(submissions as any[]) || []" :columns="columns">
      <template #createdAt-data="{ row }">
        {{ new Date((row as any).createdAt).toLocaleDateString() }}
      </template>
      <template #actions-data="{ row }">
        <UButton icon="i-lucide-eye" variant="ghost" @click="viewDetail(row)" />
      </template>

        <!-- Dynamic data columns -->
        <template v-for="col in (columns as any[]).filter(c => c.key.startsWith('data.'))" :key="col.key" #[`${col.key}-data`]="{ row }: any">
            <span class="truncate max-w-[150px] inline-block">
                {{ (row as any).data?.[col.key.split('.')[1]] }}
            </span>
        </template>
    </UTable>

    <UModal v-model="showModal">
      <div class="p-6 space-y-6">
        <div class="flex justify-between items-center border-b pb-4 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 class="text-xl font-bold">
            Submission Detail
          </h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            @click="showModal = false"
          />
        </div>

                    <div v-if="selectedSubmission" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">

                        <div v-for="field in schema" :key="field.id">

                            <div v-if="field.type === 'section'" class="font-bold border-b pt-4 pb-1 mb-2">{{ field.label }}</div>

        
            <div v-else class="flex flex-col gap-1 border-b border-default pb-2">
              <span class="text-[10px] text-dimmed uppercase font-bold tracking-wider">{{ field.label }}</span>
              <span class="text-sm whitespace-pre-wrap">{{ selectedSubmission.data[field.key] || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t mt-6">
          <UButton label="Close" color="neutral" @click="showModal = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>
