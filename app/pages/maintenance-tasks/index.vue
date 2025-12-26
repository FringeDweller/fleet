<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { tasks, loading, fetchTasks } = useMaintenanceTasks()

const search = ref('')
const columns = [
  { key: 'name', label: 'Task Name' },
  { key: 'description', label: 'Description' },
  { key: 'estimatedHours', label: 'Est. Hours' }
]

const filteredTasks = computed(() => {
  if (!search.value) return tasks.value
  return tasks.value.filter(task =>
    Object.values(task).some(val =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

onMounted(() => {
  fetchTasks()
})
</script>

<template>
  <UDashboardPanel id="maintenance-tasks">
    <template #header>
      <UDashboardNavbar title="Maintenance Tasks">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="New Task" to="/maintenance-tasks/new" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search tasks..."
            class="w-64"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :rows="filteredTasks"
        :columns="(columns as any)"
        :loading="loading"
        class="w-full"
      >
        <template #name-data="{ row }">
          <NuxtLink :to="`/maintenance-tasks/${(row as any).id}`" class="text-primary hover:underline font-medium">
            {{ (row as any).name }}
          </NuxtLink>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
