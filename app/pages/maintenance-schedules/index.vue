<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { schedules, loading, fetchSchedules } = useMaintenanceSchedules()

const search = ref('')
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'targetName', header: 'Target' },
  { accessorKey: 'taskName', header: 'Task' },
  { accessorKey: 'lastPerformedAt', header: 'Last Performed' },
  { accessorKey: 'nextDueAt', header: 'Next Due' }
]

const filteredSchedules = computed(() => {
  if (!search.value) return schedules.value
  return schedules.value.filter(
    (s) =>
      (s.name as string).toLowerCase().includes(search.value.toLowerCase()) ||
      (s.taskName as string)?.toLowerCase().includes(search.value.toLowerCase()) ||
      (s.targetName as string)?.toLowerCase().includes(search.value.toLowerCase())
  )
})

onMounted(() => {
  fetchSchedules()
})
</script>

<template>
  <UDashboardPanel id="maintenance-schedules">
    <template #header>
      <UDashboardNavbar title="Maintenance Schedules">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-calendar"
            label="Calendar"
            to="/maintenance-schedules/calendar"
            color="neutral"
            variant="ghost"
            class="mr-2"
          />
          <UButton icon="i-lucide-plus" label="New Schedule" to="/maintenance-schedules/new" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search schedules..."
            class="w-64"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :data="filteredSchedules"
        :columns="columns"
        :loading="loading"
        class="w-full"
      >
        <template #name-cell="{ row }">
          <NuxtLink :to="`/maintenance-schedules/${row.original.id}`" class="text-primary hover:underline font-medium">
            {{ row.original.name }}
          </NuxtLink>
        </template>

        <template #lastPerformedAt-cell="{ row }">
          {{ row.original.lastPerformedAt ? new Date(row.original.lastPerformedAt as string).toLocaleDateString() : '-' }}
        </template>

        <template #nextDueAt-cell="{ row }">
          {{ row.original.nextDueAt ? new Date(row.original.nextDueAt as string).toLocaleDateString() : '-' }}
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
