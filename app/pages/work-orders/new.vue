<script setup lang="ts">
const { data: assets } = await useFetch<{ items: Record<string, unknown>[] }>('/api/assets')
const toast = useToast()
const loading = ref(false)

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
  loading.value = true
  try {
    await $fetch('/api/work-orders', {
      method: 'POST',
      body: state
    })
    toast.add({
      title: 'Success',
      description: 'Work order created successfully',
      color: 'success'
    })
    await navigateTo('/work-orders')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create work order',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-4 max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        New Work Order
      </h1>
    </div>

    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Asset" name="assetId" required>
        <USelect
          v-model="state.assetId"
          :items="assetOptions"
          label-key="label"
          value-key="value"
          placeholder="Select an asset"
        />
      </UFormField>

      <UFormField label="Description" name="description" required>
        <UTextarea v-model="state.description" placeholder="Describe the maintenance needed" />
      </UFormField>

      <UFormField label="Priority" name="priority" required>
        <USelect v-model="state.priority" :items="priorityOptions" label-key="label" value-key="value" />
      </UFormField>

      <UFormField label="Due Date" name="dueDate">
        <UInput v-model="state.dueDate" type="date" />
      </UFormField>

      <div class="flex justify-end gap-4 mt-6">
        <UButton to="/work-orders" color="neutral" variant="ghost">
          Cancel
        </UButton>
        <UButton type="submit" color="primary" :loading="loading">
          Create Work Order
        </UButton>
      </div>
    </UForm>
  </div>
</template>