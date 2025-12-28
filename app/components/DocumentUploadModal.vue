<script setup lang="ts">
import type { DocumentCategory } from '~/types'

const { data: _categories } = await useFetch<DocumentCategory[]>('/api/documents/categories')

const toast = useToast()
const emit = defineEmits(['uploaded'])

const _fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const selectedCategoryId = ref<string | null>(null)
const expiryDate = ref<string | null>(null)
const isUploading = ref(false)
const progress = ref(0)

function _onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] || null
  }
}

async function _uploadFile() {
  if (!selectedFile.value) return

  isUploading.value = true
  progress.value = 10 // Start progress

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  if (selectedCategoryId.value) {
    formData.append('categoryId', selectedCategoryId.value)
  }
  if (expiryDate.value) {
    formData.append('expiryDate', expiryDate.value)
  }

  try {
    await $fetch('/api/documents', {
      method: 'POST',
      body: formData
    })

    progress.value = 100
    toast.add({ title: 'Document uploaded successfully', color: 'success' })
    emit('uploaded')
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Upload failed', color: 'error' })
  } finally {
    isUploading.value = false
  }
}

function _handleDrop(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    selectedFile.value = e.dataTransfer.files[0] || null
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <h3 class="text-lg font-bold">Upload Document</h3>
    
    <div 
      class="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center space-y-4 hover:border-primary-500 transition-colors cursor-pointer"
      @dragover.prevent
      @drop="_handleDrop"
      @click="_fileInput?.click()"
    >
      <input 
        ref="_fileInput" 
        type="file" 
        class="hidden" 
        @change="_onFileSelect"
      />
      
      <div v-if="!selectedFile">
        <UIcon name="i-lucide-cloud-upload" class="w-12 h-12 mx-auto text-gray-400" />
        <p class="text-sm text-gray-600 dark:text-gray-400">Click or drag file to upload</p>
        <p class="text-xs text-gray-500">PDF, Images, Office docs (max 50MB)</p>
      </div>
      <div v-else class="space-y-2">
        <UIcon name="i-lucide-file" class="w-12 h-12 mx-auto text-primary" />
        <p class="font-medium truncate max-w-xs mx-auto">{{ selectedFile.name }}</p>
        <p class="text-xs text-gray-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>
    </div>

    <div class="space-y-4">
      <UFormGroup label="Category">
        <USelectMenu
          v-model="selectedCategoryId"
          :options="_categories || []"
          value-attribute="id"
          option-attribute="name"
          placeholder="Select category"
        />
      </UFormGroup>

      <UFormGroup label="Expiry Date (Optional)">
        <UInput v-model="expiryDate" type="date" />
      </UFormGroup>
    </div>

    <div v-if="isUploading" class="space-y-2">
      <div class="flex justify-between text-xs">
        <span>Uploading...</span>
        <span>{{ progress }}%</span>
      </div>
      <UProgress :value="progress" color="primary" />
    </div>

    <div class="flex justify-end gap-2">
      <UButton label="Cancel" variant="ghost" @click="$emit('uploaded')" />
      <UButton label="Start Upload" icon="i-lucide-upload" :loading="isUploading" :disabled="!selectedFile" @click="_uploadFile" />
    </div>
  </div>
</template>
