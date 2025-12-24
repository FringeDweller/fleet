<script setup lang="ts">
const { data: assets } = await useFetch('/api/assets')

const state = reactive({
  assetId: undefined,
  description: '',
  priority: 'medium',
  dueDate: undefined
})

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

const assetOptions = computed(() => {
  return (assets.value?.items || []).map((a: any) => ({
    label: `${a.assetNumber} - ${a.make} ${a.model}`,
    value: a.id
  }))
})

const onSubmit = async () => {
  // TODO: Implement create API
  console.log('Create WO', state)
}
</script>

<template>
  <div class="p-4 max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">New Work Order</h1>
    </div>

    <UForm :state="state" @submit="onSubmit" class="space-y-4">
      <UFormGroup label="Asset" name="assetId" required>
        <USelectMenu
          v-model="state.assetId"
          :options="assetOptions"
          placeholder="Select an asset"
          searchable
        />
      </UFormGroup>

      <UFormGroup label="Description" name="description" required>
        <UTextarea v-model="state.description" />
      </UFormGroup>

      <UFormGroup label="Priority" name="priority" required>
        <USelect v-model="state.priority" :options="priorityOptions" />
      </UFormGroup>

      <UFormGroup label="Due Date" name="dueDate">
        <UInput type="date" v-model="state.dueDate" />
      </UFormGroup>

      <div class="flex justify-end gap-4 mt-6">
        <UButton to="/work-orders" color="neutral" variant="ghost">Cancel</UButton>
        <UButton type="submit" color="primary">Create Work Order</UButton>
      </div>
    </UForm>
  </div>
</template>
