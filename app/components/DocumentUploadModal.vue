<script setup lang="ts">
const emit = defineEmits(['uploaded'])
const toast = useToast()

const _fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
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

  try {
    // Note: Standard $fetch doesn't provide progress events easily without extra config
    // For a simple implementation, we'll just do the request
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
      class="border-2 border-dashed border-default rounded-lg p-12 text-center space-y-4 hover:border-primary-500 transition-colors"
      @dragover.prevent
      @drop="handleDrop"
      @click="fileInput?.click()"
    >
      <input 
        ref="fileInput" 
        type="file" 
        class="hidden" 
        @change="onFileSelect"
      />
      
      <div v-if="!selectedFile">
        <UIcon name="i-lucide-cloud-upload" class="w-12 h-12 mx-auto text-dimmed" />
        <p class="text-sm">Click or drag file to upload</p>
        <p class="text-xs text-dimmed">PDF, Images, Office docs (max 50MB)</p>
      </div>
      <div v-else class="space-y-2">
        <UIcon name="i-lucide-file" class="w-12 h-12 mx-auto text-primary" />
        <p class="font-medium">{{ selectedFile.name }}</p>
        <p class="text-xs text-dimmed">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>
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
      <UButton label="Start Upload" icon="i-lucide-upload" :loading="isUploading" :disabled="!selectedFile" @click="uploadFile" />
    </div>
  </div>
</template>
