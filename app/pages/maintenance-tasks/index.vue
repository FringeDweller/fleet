<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { tasks, loading, fetchTasks } = useMaintenanceTasks()

const search = ref('')
const columns = [
  { accessorKey: 'name', header: 'Task Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'estimatedHours', header: 'Est. Hours' }
]

const filteredTasks = computed(() => {
  if (!search.value) return tasks.value
  return tasks.value.filter((task) =>
    Object.values(task).some((val) =>
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
        :data="filteredTasks"
        :columns="columns"
        :loading="loading"
        class="w-full"
      >
        <template #name-cell="{ row }">
          <NuxtLink :to="`/maintenance-tasks/${row.original.id}`" class="text-primary hover:underline font-medium">
            {{ row.original.name }}
          </NuxtLink>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
