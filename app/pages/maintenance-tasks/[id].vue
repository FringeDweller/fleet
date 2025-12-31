<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: task, refresh } = await useFetch<any>(`/api/maintenance-tasks/${id}`)

const isEditOpen = ref(false)
const editLoading = ref(false)
const isDeleteConfirmOpen = ref(false)
const deleteLoading = ref(false)

const editState = reactive({
  name: '',
  description: '',
  estimatedHours: '1',
  estimatedCost: '0',
  skillLevel: 'medium'
})

watch(
  task,
  (newTask) => {
    if (newTask) {
      Object.assign(editState, {
        name: newTask.name,
        description: newTask.description,
        estimatedHours: newTask.estimatedHours,
        estimatedCost: newTask.estimatedCost,
        skillLevel: newTask.skillLevel
      })
    }
  },
  { immediate: true }
)

async function onEdit() {
  editLoading.value = true
  try {
    await $fetch(`/api/maintenance-tasks/${id}`, {
      method: 'PUT' as any,
      body: editState
    })
    toast.add({ title: 'Task updated', color: 'success' })
    isEditOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({ title: 'Error updating task', description: error.message, color: 'error' })
  } finally {
    editLoading.value = false
  }
}

async function onDelete() {
  deleteLoading.value = true
  try {
    await $fetch(`/api/maintenance-tasks/${id}`, {
      method: 'DELETE' as any
    })
    toast.add({ title: 'Task deleted', color: 'success' })
    await navigateTo('/maintenance-tasks')
  } catch (error: any) {
    toast.add({ title: 'Error deleting task', description: error.message, color: 'error' })
  } finally {
    deleteLoading.value = false
    isDeleteConfirmOpen.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="task-detail">
    <template #header>
      <UDashboardNavbar v-if="task" :title="task.name">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/maintenance-tasks" />
        </template>
        <template #right>
          <div class="flex gap-2">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" @click="isEditOpen = true" />
            <UButton icon="i-lucide-trash" color="error" variant="ghost" @click="isDeleteConfirmOpen = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="task" class="p-4 space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">General Information</h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-dimmed">Description</label>
                <p class="text-highlighted whitespace-pre-wrap">{{ task.description }}</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-dimmed">Estimated Hours</label>
                <p class="text-highlighted">{{ task.estimatedHours }} hrs</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-dimmed">Estimated Cost</label>
                <p class="text-highlighted">${{ task.estimatedCost }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-dimmed">Skill Level</label>
                <UBadge class="capitalize">{{ task.skillLevel }}</UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Modals -->
        <UModal v-model:open="isEditOpen" title="Edit Task">
          <template #body>
            <form class="space-y-6" @submit.prevent="onEdit">
              <UFormField label="Task Name" name="name" required>
                <UInput v-model="editState.name" />
              </UFormField>
              <UFormField label="Description" name="description" required>
                <UTextarea v-model="editState.description" />
              </UFormField>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Est. Hours">
                  <UInput v-model="editState.estimatedHours" type="number" step="0.5" />
                </UFormField>
                <UFormField label="Est. Cost ($)">
                  <UInput v-model="editState.estimatedCost" type="number" step="0.01" />
                </UFormField>
              </div>
              <UFormField label="Skill Level">
                <USelect v-model="editState.skillLevel" :items="['low', 'medium', 'high', 'expert']" />
              </UFormField>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" @click="isEditOpen = false">Cancel</UButton>
                <UButton type="submit" :loading="editLoading">Save Changes</UButton>
              </div>
            </form>
          </template>
        </UModal>

        <UModal v-model:open="isDeleteConfirmOpen" title="Delete Task">
          <template #body>
            <div class="space-y-4">
              <p>Are you sure you want to delete task <strong>{{ task.name }}</strong>?</p>
              <div class="flex justify-end gap-3">
                <UButton variant="ghost" @click="isDeleteConfirmOpen = false">Cancel</UButton>
                <UButton color="error" :loading="deleteLoading" @click="onDelete">Delete Task</UButton>
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
