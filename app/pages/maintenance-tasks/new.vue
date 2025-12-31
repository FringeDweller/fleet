<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const loading = ref(false)

const state = reactive({
  name: '',
  description: '',
  estimatedHours: '1',
  estimatedCost: '0',
  skillLevel: 'medium'
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/maintenance-tasks', {
      method: 'POST',
      body: state
    })
    toast.add({
      title: 'Success',
      description: 'Maintenance task created successfully',
      color: 'success'
    })
    await navigateTo('/maintenance-tasks')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create task',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="new-task">
    <template #header>
      <UDashboardNavbar title="New Maintenance Task">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/maintenance-tasks" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard class="max-w-2xl mx-auto mt-4">
        <form class="space-y-6" @submit.prevent="onSubmit">
          <UFormField label="Task Name" name="name" required>
            <UInput v-model="state.name" placeholder="e.g., Oil Change" />
          </UFormField>

          <UFormField label="Description" name="description" required>
            <UTextarea v-model="state.description" placeholder="Describe the steps for this task" />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Estimated Hours" name="estimatedHours">
              <UInput v-model="state.estimatedHours" type="number" step="0.5" />
            </UFormField>

            <UFormField label="Estimated Cost ($)" name="estimatedCost">
              <UInput v-model="state.estimatedCost" type="number" step="0.01" />
            </UFormField>

            <UFormField label="Skill Level" name="skillLevel">
              <USelect
                v-model="state.skillLevel"
                :items="['low', 'medium', 'high', 'expert']"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3">
            <UButton variant="ghost" to="/maintenance-tasks">
              Cancel
            </UButton>
            <UButton type="submit" :loading="loading">
              Create Task
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
