<script setup lang="ts">
const _selectedCategoryId = ref<string | 'all'>('all')
const _searchQuery = ref('')

const { data: _documents, refresh: _refresh } = await useFetch<any[]>('/api/documents', {
  query: computed(() => ({
    categoryId: _selectedCategoryId.value === 'all' ? undefined : _selectedCategoryId.value,
    search: _searchQuery.value || undefined
  }))
})

const { data: _categories, refresh: _refreshCategories } = await useFetch<any[]>(
  '/api/documents/categories'
)

const _isUploadModalOpen = ref(false)
const _isCategoryModalOpen = ref(false)
const _newCategoryName = ref('')

const _columns = [
  { key: 'name', label: 'Name' },
  { key: 'mimeType', label: 'Type' },
  { key: 'categoryId', label: 'Category' },
  { key: 'size', label: 'Size' },
  { key: 'version', label: 'v' },
  { key: 'expiryDate', label: 'Expiry' },
  { key: 'createdAt', label: 'Uploaded' },
  { key: 'actions', label: '' }
]

const _isVersionModalOpen = ref(false)
const _selectedDocForVersions = ref<any>(null)
const { data: _versions, refresh: _refreshVersions } = await useFetch<any[]>(() =>
  _selectedDocForVersions.value
    ? `/api/documents/${_selectedDocForVersions.value.id}/versions`
    : null
)

function _showVersions(doc: any) {
  _selectedDocForVersions.value = doc
  _isVersionModalOpen.value = true
}

const _versionFileInput = ref<HTMLInputElement | null>(null)
async function _uploadNewVersion(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0 && _selectedDocForVersions.value) {
    const file = target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`/api/documents/${_selectedDocForVersions.value.id}/versions`, {
      method: 'POST',
      body: formData
    })

    _refreshVersions()
    _refresh()
  }
}
</script>

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
  _refresh()
}

async function _createCategory() {
  if (!_newCategoryName.value) return
  await $fetch('/api/documents/categories', {
    method: 'POST',
    body: { name: _newCategoryName.value }
  })
  _newCategoryName.value = ''
  _isCategoryModalOpen.value = false
  _refreshCategories()
}

const _categoryMap = computed(() => {
  const map: Record<string, string> = {}
  _categories.value?.forEach((cat) => {
    map[cat.id] = cat.name
  })
  return map
})

const _categoryOptions = computed(() => {
  return [{ id: 'all', name: 'All Categories' }, ...(_categories.value || [])]
})
</script>

<template>
  <UDashboardPanel id="documents">
    <template #header>
      <UDashboardNavbar title="Documents">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UInput
            v-model="_searchQuery"
            icon="i-lucide-search"
            placeholder="Search documents..."
            class="w-64"
          />
          <USelectMenu
            v-model="_selectedCategoryId"
            :options="_categoryOptions"
            value-attribute="id"
            option-attribute="name"
            class="w-48"
          />
          <UButton label="Categories" icon="i-lucide-folder-plus" variant="soft" @click="_isCategoryModalOpen = true" />
          <UButton label="Upload Document" icon="i-lucide-upload" @click="_isUploadModalOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="_documents || []" :columns="_columns as any[]">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UIcon :name="row.original.mimeType.includes('pdf') ? 'i-lucide-file-text' : 'i-lucide-file'" />
            <a :href="row.original.url" target="_blank" class="text-primary hover:underline">{{ row.original.name }}</a>
          </div>
        </template>
        <template #categoryId-cell="{ row }">
          <span class="text-sm text-gray-500">{{ _categoryMap[row.original.categoryId] || '-' }}</span>
        </template>
        <template #size-cell="{ row }">
          {{ _formatSize(row.original.size) }}
        </template>
        <template #expiryDate-cell="{ row }">
          <span :class="{ 'text-error': row.original.expiryDate && new Date(row.original.expiryDate) < new Date() }">
            {{ row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : '-' }}
          </span>
        </template>
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt).toLocaleDateString() }}
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton icon="i-lucide-history" variant="ghost" size="xs" @click="_showVersions(row.original)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" @click="_deleteDoc(row.original.id)" />
          </div>
        </template>
      </UTable>

      <UModal v-model="_isVersionModalOpen">
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold">Version History</h3>
            <UButton label="Upload New Version" icon="i-lucide-upload" size="xs" @click="_versionFileInput?.click()" />
            <input ref="_versionFileInput" type="file" class="hidden" @change="_uploadNewVersion" />
          </div>

          <UTable
            :data="_versions || []"
            :columns="[
              { key: 'version', label: 'Ver' },
              { key: 'name', label: 'Name' },
              { key: 'createdAt', label: 'Date' },
              { key: 'actions', label: '' }
            ]"
          >
            <template #name-cell="{ row }">
              <a :href="row.original.url" target="_blank" class="text-primary hover:underline">{{ row.original.name }}</a>
            </template>
            <template #createdAt-cell="{ row }">
              {{ new Date(row.original.createdAt).toLocaleString() }}
            </template>
            <template #actions-cell="{ row }">
              <UBadge v-if="row.original.isLatest" color="success" size="xs">Latest</UBadge>
            </template>
          </UTable>

          <div class="flex justify-end">
            <UButton label="Close" variant="ghost" @click="_isVersionModalOpen = false" />
          </div>
        </div>
      </UModal>

      <UModal v-model="_isUploadModalOpen">
        <DocumentUploadModal @uploaded="() => { _isUploadModalOpen = false; _refresh() }" />
      </UModal>

      <UModal v-model="_isCategoryModalOpen">
        <div class="p-6 space-y-6">
          <h3 class="text-lg font-bold">Manage Categories</h3>
          
          <div class="space-y-4">
            <div v-for="cat in _categories" :key="cat.id" class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span>{{ cat.name }}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <UInput v-model="_newCategoryName" placeholder="New category name" class="flex-1" />
            <UButton label="Add" @click="_createCategory" />
          </div>

          <div class="flex justify-end">
            <UButton label="Close" variant="ghost" @click="_isCategoryModalOpen = false" />
          </div>
        </div>
      </UModal>
    </template>
  </UDashboardPanel>
</template>