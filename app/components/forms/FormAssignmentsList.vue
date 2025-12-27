<script setup lang="ts">
const props = defineProps<{
  formId: string
}>()

const { data: _assignments, refresh } = await useFetch<Record<string, unknown>[]>(
  '/api/settings/forms/assignments',
  {
    query: { formGroupId: props.formGroupId }
  }
)

defineExpose({ refresh })

async function _deleteAssignment(id: string) {
  await $fetch(`/api/settings/forms/assignments/${id}`, { method: 'DELETE' as unknown })
  refresh()
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!_assignments || _assignments.length === 0" class="text-sm text-dimmed text-center py-8">
      No assignments for this form
    </div>
    <div
      v-for="assignment in _assignments"
      :key="assignment.id as string"
      class="flex items-center justify-between p-3 border border-elevated rounded-md bg-elevated/20"
    >
      <div>
        <div class="text-sm font-medium text-highlighted">
          {{ (assignment.targetName as string) }}
        </div>
        <div class="text-xs text-dimmed">
          Assigned on {{ format(new Date(assignment.createdAt as string), 'PPP') }}
        </div>
      </div>

      <UButton
        icon="i-heroicons-trash"
        color="error"
        variant="ghost"
        size="xs"
        @click="_deleteAssignment(assignment.id as string)"
      />
    </div>
  </div>
</template>
