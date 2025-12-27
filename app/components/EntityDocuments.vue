<script setup lang="ts">
const props = defineProps<{
  entityType: string
  entityId: string
}>()

const { data: documents, refresh } = await useFetch<any[]>(
  `/api/documents/links/${props.entityType}/${props.entityId}`
)
const { data: allDocuments } = await useFetch<any[]>('/api/documents')

const isLinkModalOpen = ref(false)
const selectedDocId = ref<string | null>(null)

async function _linkDocument() {
  if (!selectedDocId.value) return
  await $fetch('/api/documents/links', {
    method: 'POST',
    body: {
      documentId: selectedDocId.value,
      entityType: props.entityType,
      entityId: props.entityId
    }
  })
  selectedDocId.value = null
  isLinkModalOpen.value = false
  refresh()
}

async function _unlinkDocument(docId: string) {
  if (!confirm('Are you sure you want to unlink this document?')) return
  await $fetch('/api/documents/links', {
    method: 'DELETE',
    body: {
      documentId: docId,
      entityType: props.entityType,
      entityId: props.entityId
    }
  })
  refresh()
}

function _formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const _unlinkedDocuments = computed(() => {
  if (!allDocuments.value) return []
  const linkedIds = new Set(documents.value?.map((d) => d.id) || [])
  return allDocuments.value.filter((d) => !linkedIds.has(d.id))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
      <UButton label="Link Document" icon="i-lucide-link" size="xs" @click="isLinkModalOpen = true" />
    </div>

    <UTable
      :data="documents || []"
      :columns="[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'size', header: 'Size' },
        { accessorKey: 'createdAt', header: 'Linked' },
        { accessorKey: 'actions', header: '' }
      ]"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2">
          <UIcon :name="row.original.mimeType.includes('pdf') ? 'i-lucide-file-text' : 'i-lucide-file'" />
          <a :href="row.original.url" target="_blank" class="text-primary hover:underline">{{ row.original.name }}</a>
        </div>
      </template>
      <template #size-cell="{ row }">
        {{ _formatSize(row.original.size) }}
      </template>
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString() }}
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UButton icon="i-lucide-link-2-off" color="error" variant="ghost" size="xs" @click="_unlinkDocument(row.original.id)" />
        </div>
      </template>
    </UTable>

    <UModal v-model="isLinkModalOpen">
      <div class="p-6 space-y-6">
        <h3 class="text-lg font-bold">Link Existing Document</h3>
        
        <UFormGroup label="Select Document">
          <USelectMenu
            v-model="selectedDocId"
            :options="_unlinkedDocuments"
            value-attribute="id"
            option-attribute="name"
            searchable
            placeholder="Search for a document..."
          />
        </UFormGroup>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" variant="ghost" @click="isLinkModalOpen = false" />
          <UButton label="Link" :disabled="!selectedDocId" @click="_linkDocument" />
        </div>
      </div>
    </UModal>
  </div>
</template>
