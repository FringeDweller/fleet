<script setup lang="ts">
import Papa from 'papaparse'

const toast = useToast()

const currentStep = ref(1)
const selectedType = ref('assets')
const file = ref<File | null>(null)
const parsedData = ref<any[]>([])
const csvHeaders = ref<string[]>([])
const fieldMapping = ref<Record<string, string>>({}) // System Field Key -> CSV Header
const validationResult = ref<{ validRows: any[]; invalidRows: any[]; errors: any[] } | null>(null)
const importResult = ref<{ created: number; updated: number; errors: any[] } | null>(null)
const isProcessing = ref(false)

const { data: importTypes } = await useFetch<any[]>('/api/import/types')
const { data: fields } = await useFetch<any[]>(() => `/api/import/fields?type=${selectedType.value}`)

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    file.value = target.files[0]
  }
}

function parseFile() {
  if (!file.value) return

  isProcessing.value = true
  Papa.parse(file.value, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      parsedData.value = results.data
      csvHeaders.value = results.meta.fields || []
      autoMap()
      currentStep.value = 2
      isProcessing.value = false
    },
    error: (err) => {
      toast.add({ title: 'Error parsing CSV', description: err.message, color: 'error' })
      isProcessing.value = false
    }
  })
}

function autoMap() {
  if (!fields.value) return
  const mapping: Record<string, string> = {}

  fields.value.forEach((field) => {
    // Try exact match then fuzzy
    const match = csvHeaders.value.find(
      (h) =>
        h.toLowerCase() === field.label.toLowerCase() || h.toLowerCase() === field.key.toLowerCase()
    )
    if (match) {
      mapping[field.key] = match
    }
  })
  fieldMapping.value = mapping
}

function downloadTemplate() {
  if (!fields.value) return
  const headers = fields.value.map((f) => f.key)
  const csv = Papa.unparse([headers])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${selectedType.value}_template.csv`
  link.click()
}

async function validateData() {
  // Transform data based on mapping
  const mappedRows = parsedData.value.map((row) => {
    const newRow: Record<string, any> = {}
    for (const [sysKey, csvHeader] of Object.entries(fieldMapping.value)) {
      if (csvHeader) {
        newRow[sysKey] = row[csvHeader]
      }
    }
    return newRow
  })

  isProcessing.value = true
  try {
    const res = await $fetch('/api/import/validate', {
      method: 'POST',
      body: { type: selectedType.value, rows: mappedRows }
    })
    validationResult.value = res as any
    currentStep.value = 3
  } catch (err: any) {
    toast.add({ title: 'Validation Failed', description: err.message, color: 'error' })
  } finally {
    isProcessing.value = false
  }
}

async function executeImport() {
  if (!validationResult.value) return

  isProcessing.value = true
  try {
    const res = await $fetch('/api/import/execute', {
      method: 'POST',
      body: { type: selectedType.value, rows: validationResult.value.validRows }
    })
    importResult.value = res as any
    currentStep.value = 4
    toast.add({ title: 'Import Complete', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Import Failed', description: err.message, color: 'error' })
  } finally {
    isProcessing.value = false
  }
}

function reset() {
  currentStep.value = 1
  file.value = null
  parsedData.value = []
  csvHeaders.value = []
  fieldMapping.value = {}
  validationResult.value = null
  importResult.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">Data Import</h2>
        <p class="text-gray-500">Bulk import data into the system.</p>
      </div>
      <div class="flex gap-2">
        <UButton v-if="currentStep === 1" label="Download Template" icon="i-lucide-download" color="neutral" variant="ghost" @click="downloadTemplate" />
        <UButton v-if="currentStep === 4" label="Import Another File" @click="reset" />
      </div>
    </div>

    <!-- Step 1: Upload -->
    <UCard v-if="currentStep === 1">
       <template #header>
         <h3 class="font-bold">1. Upload File</h3>
       </template>
       <div class="space-y-4">
         <UFormField label="Import Type">
           <USelect v-model="selectedType" :items="importTypes || []" label-key="label" value-key="id" />
         </UFormField>
         
         <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input type="file" accept=".csv" @change="onFileSelect" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            <p class="mt-2 text-xs text-muted">Upload a CSV file.</p>
         </div>

         <div class="flex justify-end">
            <UButton label="Next: Map Columns" :disabled="!file" :loading="isProcessing" @click="parseFile" />
         </div>
       </div>
    </UCard>

    <!-- Step 2: Mapping -->
    <UCard v-if="currentStep === 2">
       <template #header>
         <h3 class="font-bold">2. Map Columns</h3>
       </template>
       <div class="space-y-4">
         <p class="text-sm text-muted">Map your CSV columns to the system fields.</p>
         
         <div class="grid grid-cols-2 gap-4">
            <div v-for="field in fields" :key="field.key" class="border p-3 rounded-md">
               <div class="mb-2">
                  <span class="font-medium text-sm">{{ field.label }}</span>
                  <span v-if="field.required" class="text-red-500 ml-1">*</span>
                  <p v-if="field.description" class="text-xs text-muted">{{ field.description }}</p>
               </div>
               <USelect 
                 v-model="fieldMapping[field.key]" 
                 :items="csvHeaders" 
                 placeholder="Select CSV Header" 
               />
            </div>
         </div>

         <div class="flex justify-between">
            <UButton label="Back" color="neutral" variant="ghost" @click="currentStep = 1" />
            <UButton label="Next: Validate" :loading="isProcessing" @click="validateData" />
         </div>
       </div>
    </UCard>

    <!-- Step 3: Validate -->
    <UCard v-if="currentStep === 3">
       <template #header>
         <h3 class="font-bold">3. Review & Import</h3>
       </template>
       <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
             <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <div class="text-2xl font-bold text-green-600">{{ validationResult?.validRows.length }}</div>
                <div class="text-sm text-green-800 dark:text-green-200">Valid Rows</div>
             </div>
             <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <div class="text-2xl font-bold text-red-600">{{ validationResult?.invalidRows.length }}</div>
                <div class="text-sm text-red-800 dark:text-red-200">Invalid Rows</div>
             </div>
          </div>

          <div v-if="validationResult?.errors && validationResult.errors.length > 0">
             <h4 class="text-sm font-bold mt-4 mb-2">Validation Errors</h4>
             <div class="max-h-60 overflow-y-auto border rounded-md text-xs">
                <table class="w-full text-left">
                   <thead class="bg-gray-50 dark:bg-gray-800">
                      <tr>
                         <th class="p-2">Row</th>
                         <th class="p-2">Error</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr v-for="(err, i) in validationResult.errors" :key="i" class="border-t">
                         <td class="p-2">{{ err.row }}</td>
                         <td class="p-2 text-red-600">{{ err.message }}</td>
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>
          
          <div class="flex justify-between">
             <UButton label="Back" color="neutral" variant="ghost" @click="currentStep = 2" />
             <UButton 
               label="Import Valid Rows" 
               :disabled="!validationResult || validationResult.validRows.length === 0" 
               :loading="isProcessing" 
               color="primary"
               @click="executeImport" 
             />
          </div>
       </div>
    </UCard>

    <!-- Step 4: Result -->
    <UCard v-if="currentStep === 4">
       <template #header>
         <h3 class="font-bold">Import Result</h3>
       </template>
       <div class="space-y-4 text-center py-8">
          <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
          <h3 class="text-xl font-bold">Import Successful</h3>
          <p class="text-muted">Successfully imported {{ importResult?.created }} records.</p>
          
          <div v-if="importResult?.errors && importResult.errors.length > 0" class="mt-4 text-left">
             <p class="text-red-500 font-bold">Errors occurred during import:</p>
             <ul class="list-disc pl-5 text-sm text-red-600">
                <li v-for="(err, i) in importResult.errors" :key="i">{{ err.message }}</li>
             </ul>
          </div>
       </div>
    </UCard>
  </div>
</template>