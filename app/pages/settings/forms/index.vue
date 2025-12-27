<script setup lang="ts">
interface Form {
  id: string
  title: string
  status: string
  createdAt: string
  organizationId: string
}

const { data: forms, refresh } = await useFetch<Form[]>('/api/settings/forms')

const _columns: Record<string, unknown>[] = [
  { key: 'title', label: 'Title' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: '' }
]

const isOpen = ref(false)
const newFormTitle = ref('')

async function _createForm() {
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
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">
        Custom Forms
      </h2>
      <UButton label="Create Form" @click="isOpen = true" />
    </div>

    <UTable :rows="(forms as Form[]) || []" :columns="columns as any[]">
      <template #status-data="{ row }">
        <UBadge :color="(row as any).status === 'published' ? 'success' : 'neutral'">
          {{ (row as any).status }}
        </UBadge>
      </template>
      <template #createdAt-data="{ row }">
        {{ new Date((row as any).createdAt).toLocaleDateString() }}
      </template>
      <template #actions-data="{ row }">
        <UButton icon="i-lucide-edit" variant="ghost" :to="`/settings/forms/${(row as any).id}`" />
      </template>
    </UTable>

    <UModal v-model="isOpen">
      <div class="p-6 space-y-4">
        <h3 class="font-bold">
          New Form
        </h3>
        <UInput v-model="newFormTitle" placeholder="Form Title" />
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" variant="ghost" @click="isOpen = false" />
          <UButton label="Create" @click="createForm" />
        </div>
      </div>
    </UModal>
  </div>
</template>
