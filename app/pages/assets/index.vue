<script setup lang="ts">
import Papa from 'papaparse'
import type { Asset } from '~/types'
import { exportToCSV } from '~/utils/export'

const columns = [
  { accessorKey: 'assetNumber', header: 'Asset #' },
  { accessorKey: 'make', header: 'Make' },
  { accessorKey: 'model', header: 'Model' },
  { accessorKey: 'categoryName', header: 'Category' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' }
]

const search = ref('')
const selectedStatus = ref('')
const page = ref(1)
const pageCount = 10

const {
  data: assets,
  status,
  refresh
} = await useFetch<{ items: Asset[]; total: number }>('/api/assets', {
  query: {
    q: search,
    status: selectedStatus,
    page,
    limit: pageCount
  }
})

const pending = computed(() => status.value === 'pending')
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const exporting = ref(false)
const toast = useToast()

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Disposed', value: 'disposed' }
]

function handleImportClick() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  importing.value = true
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      try {
        const rows = results.data
        await $fetch('/api/assets/import', {
          method: 'POST',
          body: { rows }
        })
        toast.add({
          title: 'Import Successful',
          description: `Imported ${rows.length} assets`,
          color: 'success'
        })
        refresh()
      } catch (e: any) {
        toast.add({
          title: 'Import Failed',
          description: e.data?.message || e.message,
          color: 'error'
        })
      } finally {
        importing.value = false
        if (fileInput.value) fileInput.value.value = ''
      }
    },
    error: (error) => {
      toast.add({
        title: 'Parse Error',
        description: error.message,
        color: 'error'
      })
      importing.value = false
    }
  })
}

async function handleExport() {
  exporting.value = true
  try {
    const data = await $fetch<any[]>('/api/assets/export', {
      query: {
        q: search.value
        // We could pass status filter too if the API supports it
      }
    })

    // Filter out action column for export
    const exportColumns = columns.filter((c) => c.accessorKey !== 'actions')
    exportToCSV(data, exportColumns, 'assets-export')

    toast.add({
      title: 'Export Successful',
      color: 'success'
    })
  } catch (e: any) {
    toast.add({
      title: 'Export Failed',
      description: e.message,
      color: 'error'
    })
  } finally {
    exporting.value = false
  }
}

function handleDownloadTemplate() {
  const templateColumns = [
    { key: 'assetNumber', header: 'Asset Number' },
    { key: 'make', header: 'Make' },
    { key: 'model', header: 'Model' },
    { key: 'year', header: 'Year' },
    { key: 'category', header: 'Category Name' },
    { key: 'vin', header: 'VIN' },
    { key: 'licensePlate', header: 'License Plate' },
    { key: 'status', header: 'Status' },
    { key: 'currentMileage', header: 'Current Mileage' },
    { key: 'currentHours', header: 'Current Hours' }
  ]
  exportToCSV([], templateColumns, 'assets-import-template')
}
</script>
<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-highlighted">
        Assets
      </h1>
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="handleFileChange"
        />
        <UDropdown
          :items="[
            [{ label: 'Import from CSV', icon: 'i-lucide-upload', click: handleImportClick }],
            [{ label: 'Download Template', icon: 'i-lucide-file-spreadsheet', click: handleDownloadTemplate }]
          ]"
        >
          <UButton
            icon="i-lucide-import"
            color="neutral"
            variant="soft"
            :loading="importing"
          >
            Import
          </UButton>
        </UDropdown>
        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="soft"
          :loading="exporting"
          @click="handleExport"
        >
          Export
        </UButton>
        <UButton to="/assets/new" icon="i-lucide-plus" color="primary">
          New Asset
        </UButton>
      </div>
    </div>

    <div class="flex gap-4 mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search assets..."
        class="w-64"
      />
      <USelect
        v-model="selectedStatus"
        :options="statusOptions"
        placeholder="Status"
        class="w-40"
      />
    </div>

    <UTable
      :data="assets?.items || []"
      :columns="columns"
      :loading="pending"
    >
      <template #status-cell="{ row }">
        <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'">
          {{ row.original.status }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          :to="`/assets/${row.original.id}`"
          icon="i-lucide-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UTable>

    <div class="flex justify-end mt-4">
      <UPagination
        v-model="page"
        :page-count="pageCount"
        :total="assets?.total || 0"
      />
    </div>
  </div>
</template>
