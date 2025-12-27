<script setup lang="ts">
const { data: documents, refresh } = await useFetch<any[]>('/api/documents')

const _isUploadModalOpen = ref(false)

const _columns = [
  { key: 'name', label: 'Name' },
  { key: 'mimeType', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'createdAt', label: 'Uploaded' },
  { key: 'actions', label: '' }
]

function _formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

async function _deleteDoc(id: string) {
  if (!confirm('Are you sure you want to delete this document?')) return
  await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <UDashboardPanel id="documents">
    <template #header>
      <UDashboardNavbar title="Documents">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Upload Document" icon="i-lucide-upload" @click="isUploadModalOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="documents || []" :columns="columns as any[]">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UIcon :name="row.original.mimeType.includes('pdf') ? 'i-lucide-file-text' : 'i-lucide-file'" />
            <a :href="row.original.url" target="_blank" class="text-primary hover:underline">{{ row.original.name }}</a>
          </div>
        </template>
        <template #size-cell="{ row }">
          {{ formatSize(row.original.size) }}
        </template>
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt).toLocaleDateString() }}
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" @click="deleteDoc(row.original.id)" />
          </div>
        </template>
      </UTable>

      <UModal v-model="isUploadModalOpen">
        <DocumentUploadModal @uploaded="() => { isUploadModalOpen = false; refresh() }" />
      </UModal>
    </template>
  </UDashboardPanel>
</template>