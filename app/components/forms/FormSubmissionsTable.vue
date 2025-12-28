<script setup lang="ts">
import type { FormSubmission } from '~/types'
import type { FormField } from '../../../types/form-builder'

const props = defineProps<{
  formId: string
  schema: FormField[]
}>()

const { data: submissions } = await useFetch<FormSubmission[]>(`/api/forms/submissions`, {
  query: { formId: props.formId }
})

const columns = computed(() => {
  const cols: { accessorKey: string; header: string }[] = [
    { accessorKey: 'createdAt', header: 'Date' },
    { accessorKey: 'targetModule', header: 'Module' },
    { accessorKey: 'submittedBy', header: 'User' }
  ]

  // Add first 3 fields from schema as columns
  if (props.schema) {
    props.schema.slice(0, 3).forEach((f) => {
      if (f.type !== 'section') {
        cols.push({ accessorKey: `data.${f.key}`, header: f.label })
      }
    })
  }

  cols.push({ accessorKey: 'actions', header: '' })
  return cols
})
function exportToCSV() {
  if (!submissions.value) return

  const headers = columns.value.map((c) => c.header).join(',')
  const rows = submissions.value
    .map((sub) => {
      return columns.value
        .map((col) => {
          if (col.accessorKey === 'createdAt') return new Date(sub.createdAt).toLocaleString()
          if (col.accessorKey === 'targetModule') return sub.targetModule
          if (col.accessorKey === 'submittedBy') return sub.submittedBy
          if (col.accessorKey.startsWith('data.')) {
            const key = col.accessorKey.split('.')[1] as string
            return `"${sub.data?.[key] || ''}"`
          }
          return ''
        })
        .join(',')
    })
    .join('\n')

  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `submissions_${props.formId}.csv`)
  document.body.appendChild(link)
  link.click()
}

const selectedSubmission = ref<FormSubmission | null>(null)
const showModal = ref(false)

function viewDetail(sub: FormSubmission) {
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
        @click="exportToCSV"
      />
    </div>

    <UTable :data="submissions || []" :columns="columns">
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString() }}
      </template>
      <template #actions-cell="{ row }">
        <UButton icon="i-lucide-eye" variant="ghost" @click="viewDetail(row.original)" />
      </template>

      <!-- Dynamic data columns -->
      <template v-for="col in columns.filter((c) => c.accessorKey.startsWith('data.'))" :key="col.accessorKey" #[`${col.accessorKey}-cell`]="{ row }">
        <span class="truncate max-w-[150px] inline-block">
          {{ (row.original as FormSubmission).data?.[col.accessorKey.split('.')[1] || ''] }}
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
          <div v-for="field in (schema as FormField[])" :key="field.id">
            <div v-if="field.type === 'section'" class="font-bold border-b pt-4 pb-1 mb-2">
              {{ field.label }}
            </div>
            <div v-else class="flex flex-col gap-1 border-b border-default pb-2">
              <span class="text-[10px] text-dimmed uppercase font-bold tracking-wider">{{ field.label }}</span>
              <span class="text-sm whitespace-pre-wrap">{{ (selectedSubmission.data as Record<string, unknown>)[field.key] || '-' }}</span>
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
