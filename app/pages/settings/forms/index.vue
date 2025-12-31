<script setup lang="ts">
interface Form {
  id: string
  title: string
  status: string
  createdAt: string
  organizationId: string
}

const { data: forms, refresh } = await useFetch<Form[]>('/api/settings/forms')

const columns = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created' },
  { accessorKey: 'actions', header: '' }
]

const isOpen = ref(false)
const newFormTitle = ref('')

async function createForm() {
  if (!newFormTitle.value) return
  await $fetch('/api/settings/forms', {
    method: 'POST',
    body: { title: newFormTitle.value }
  })
  newFormTitle.value = ''
  isOpen.value = false
  refresh()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center px-1">
      <h2 class="text-lg font-semibold text-highlighted">
        Custom Forms
      </h2>
      <UButton label="Create Form" icon="i-lucide-plus" @click="isOpen = true" />
    </div>

    <UTable :data="forms || []" :columns="columns">
      <template #status-cell="{ row }">
        <UBadge :color="row.original.status === 'published' ? 'success' : 'neutral'" variant="subtle">
          {{ row.original.status }}
        </UBadge>
      </template>
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString() }}
      </template>
      <template #actions-cell="{ row }">
        <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs" :to="`/settings/forms/${row.original.id}`" />
      </template>
    </UTable>

    <UModal v-model:open="isOpen" title="New Form">
      <template #body>
        <div class="space-y-4">
          <UInput v-model="newFormTitle" placeholder="Form Title" />
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" @click="isOpen = false" />
            <UButton label="Create" @click="createForm" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
