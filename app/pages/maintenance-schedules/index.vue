<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { schedules, loading, fetchSchedules } = useMaintenanceSchedules()

const search = ref('')
const columns: any[] = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'targetName', label: 'Target' },
  { key: 'taskName', label: 'Task' },
  { key: 'lastPerformedAt', label: 'Last Performed' },
  { key: 'nextDueAt', label: 'Next Due' }
]

const filteredSchedules = computed(() => {
  if (!search.value) return schedules.value
  return schedules.value.filter(s =>
    s.name.toLowerCase().includes(search.value.toLowerCase())
    || s.taskName?.toLowerCase().includes(search.value.toLowerCase())
    || s.targetName?.toLowerCase().includes(search.value.toLowerCase())
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
        :rows="filteredSchedules"
        :columns="columns"
        :loading="loading"
        class="w-full"
      >
        <template #name-data="{ row }">
          <NuxtLink :to="`/maintenance-schedules/${(row as any).id}`" class="text-primary hover:underline font-medium">
            {{ (row as any).name }}
          </NuxtLink>
        </template>

        <template #lastPerformedAt-data="{ row }">
          {{ (row as any).lastPerformedAt ? new Date((row as any).lastPerformedAt).toLocaleDateString() : '-' }}
        </template>

        <template #nextDueAt-data="{ row }">
          {{ (row as any).nextDueAt ? new Date((row as any).nextDueAt).toLocaleDateString() : '-' }}
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
