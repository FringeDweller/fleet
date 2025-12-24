<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: wo, pending } = await useFetch(`/api/work-orders/${id}`)

const items = [
  { label: 'Details', slot: 'details' },
  { label: 'Checklist', slot: 'checklist' },
  { label: 'Parts', slot: 'parts' },
  { label: 'Photos', slot: 'photos', disabled: true },
  { label: 'Time & Cost', slot: 'cost', disabled: true },
  { label: 'History', slot: 'history', disabled: true }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'primary'
    case 'in_progress': return 'info'
    case 'pending_parts': return 'warning'
    case 'completed': return 'success'
    case 'closed': return 'neutral'
    default: return 'neutral'
  }
}
</script>

<template>
  <div class="p-4">
    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="wo">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">{{ wo.woNumber }}</h1>
          <p class="text-gray-500">{{ wo.description }}</p>
        </div>
        <div class="flex gap-2">
          <UBadge :color="getStatusColor(wo.status)" size="lg">
            {{ wo.status }}
          </UBadge>
          <UButton icon="i-heroicons-pencil-square" color="neutral" variant="ghost">Edit</UButton>
        </div>
      </div>

      <UTabs :items="items" class="w-full">
        <template #details>
          <UCard class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">Work Order Details</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Asset</label>
                  <p class="font-medium">{{ (wo as any).assetNumber }} - {{ (wo as any).assetMake }} {{ (wo as any).assetModel }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Priority</label>
                  <p class="capitalize">{{ wo.priority }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Due Date</label>
                  <p>{{ wo.dueDate || '-' }}</p>
                </div>
              </div>
              <div class="space-y-4">
                 <div>
                  <label class="block text-sm font-medium text-gray-500">Created</label>
                  <p>{{ new Date(wo.createdAt).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </template>
        
        <template #checklist>
          <UCard class="mt-4">
             <div class="text-gray-500">Checklist items will appear here</div>
             <pre class="text-xs mt-2 bg-gray-50 p-2 rounded">{{ wo.checklist }}</pre>
          </UCard>
        </template>

        <template #parts>
          <UCard class="mt-4">
             <div class="text-gray-500">Parts usage will appear here</div>
          </UCard>
        </template>
      </UTabs>
    </div>
    <div v-else class="text-center p-8">
      <p class="text-red-500">Work Order not found</p>
      <UButton to="/work-orders" color="neutral" variant="ghost" class="mt-4">Back to List</UButton>
    </div>
  </div>
</template>
