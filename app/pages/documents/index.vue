<script setup lang="ts">
const selectedCategoryId = ref<string | 'all'>('all')
const searchQuery = ref('')

const { data: documents, refresh } = await useFetch<any[]>('/api/documents', {
  query: computed(() => ({
    categoryId: selectedCategoryId.value === 'all' ? undefined : selectedCategoryId.value,
    search: searchQuery.value || undefined
  }))
})

const { data: categories, refresh: refreshCategories } = await useFetch<any[]>(
  '/api/documents/categories'
)

const isUploadModalOpen = ref(false)
const isCategoryModalOpen = ref(false)
const newCategoryName = ref('')

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'mimeType', header: 'Type' },
  { accessorKey: 'categoryId', header: 'Category' },
  { accessorKey: 'size', header: 'Size' },
  { accessorKey: 'version', header: 'v' },
  { accessorKey: 'expiryDate', header: 'Expiry' },
  { accessorKey: 'createdAt', header: 'Uploaded' },
  { accessorKey: 'actions', header: '' }
]

const isVersionModalOpen = ref(false)
const selectedDocForVersions = ref<any>(null)
const { data: versions, refresh: refreshVersions } = await useFetch<any[]>(
  () =>
    selectedDocForVersions.value
      ? `/api/documents/${selectedDocForVersions.value.id}/versions`
      : '/api/documents' // Fallback to avoid null
)

function showVersions(doc: any) {
  selectedDocForVersions.value = doc
  isVersionModalOpen.value = true
}

const versionFileInput = ref<HTMLInputElement | null>(null)
async function uploadNewVersion(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0 && selectedDocForVersions.value) {
    const file = target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`/api/documents/${selectedDocForVersions.value.id}/versions`, {
      method: 'POST',
      body: formData
    })

    refreshVersions()
    refresh()
  }
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

async function deleteDoc(id: string) {
  if (!confirm('Are you sure you want to delete this document?')) return
  await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
  refresh()
}

async function createCategory() {
  if (!newCategoryName.value) return
  await $fetch('/api/documents/categories', {
    method: 'POST',
    body: { name: newCategoryName.value }
  })
  newCategoryName.value = ''
  isCategoryModalOpen.value = false
  refreshCategories()
}

const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach((cat) => {
    map[cat.id] = cat.name
  })
  return map
})

const categoryOptions = computed(() => {
  return [{ id: 'all', name: 'All Categories' }, ...(categories.value || [])]
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
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search documents..."
            class="w-64"
          />
          <USelectMenu
            v-model="selectedCategoryId"
            :options="categoryOptions"
            value-attribute="id"
            option-attribute="name"
            class="w-48"
          />
          <UButton label="Categories" icon="i-lucide-folder-plus" variant="soft" @click="isCategoryModalOpen = true" />
          <UButton label="Upload Document" icon="i-lucide-upload" @click="isUploadModalOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="documents || []" :columns="columns">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UIcon :name="row.original.mimeType.includes('pdf') ? 'i-lucide-file-text' : 'i-lucide-file'" />
            <a :href="row.original.url" target="_blank" class="text-primary hover:underline">{{ row.original.name }}</a>
          </div>
        </template>
        <template #categoryId-cell="{ row }">
          <span class="text-sm text-gray-500">{{ categoryMap[row.original.categoryId] || '-' }}</span>
        </template>
        <template #size-cell="{ row }">
          {{ formatSize(row.original.size) }}
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
            <UButton icon="i-lucide-history" variant="ghost" size="xs" @click="showVersions(row.original)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" @click="deleteDoc(row.original.id)" />
          </div>
        </template>
      </UTable>

      <UModal v-model:open="isVersionModalOpen" title="Version History">
        <template #body>
          <div class="space-y-6">
            <div class="flex justify-end">
              <UButton label="Upload New Version" icon="i-lucide-upload" size="xs" @click="versionFileInput?.click()" />
              <input ref="versionFileInput" type="file" class="hidden" @change="uploadNewVersion" />
            </div>

            <UTable
              :data="versions || []"
              :columns="[
                { accessorKey: 'version', header: 'Ver' },
                { accessorKey: 'name', header: 'Name' },
                { accessorKey: 'createdAt', header: 'Date' },
                { accessorKey: 'actions', header: '' }
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
              <UButton label="Close" variant="ghost" @click="isVersionModalOpen = false" />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="isUploadModalOpen" title="Upload Document">
        <template #body>
          <DocumentUploadModal @uploaded="() => { isUploadModalOpen = false; refresh() }" />
        </template>
      </UModal>

      <UModal v-model:open="isCategoryModalOpen" title="Manage Categories">
        <template #body>
          <div class="space-y-6">
            <div class="space-y-4">
              <div v-for="cat in categories" :key="cat.id" class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span>{{ cat.name }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <UInput v-model="newCategoryName" placeholder="New category name" class="flex-1" />
              <UButton label="Add" @click="createCategory" />
            </div>

            <div class="flex justify-end">
              <UButton label="Close" variant="ghost" @click="isCategoryModalOpen = false" />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>