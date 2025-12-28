<script setup lang="ts">
import { format } from 'date-fns'
import type { FormAssignment } from '~/types'

const props = defineProps<{
  formId: string
}>()

const { data: assignments, refresh } = await useFetch<FormAssignment[]>(
  '/api/settings/forms/assignments',
  {
    query: { formId: props.formId }
  }
)

defineExpose({ refresh })

async function deleteAssignment(id: string) {
  await $fetch(`/api/settings/forms/assignments/${id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!assignments || assignments.length === 0" class="text-sm text-dimmed text-center py-8">
      No assignments for this form
    </div>
    <div
      v-for="assignment in assignments"
      :key="assignment.id"
      class="flex items-center justify-between p-3 border border-elevated rounded-md bg-elevated/20"
    >
      <div>
        <div class="text-sm font-medium text-highlighted">
          {{ assignment.targetName }}
        </div>
        <div class="text-xs text-dimmed">
          Assigned on {{ format(new Date(assignment.createdAt), 'PPP') }}
        </div>
      </div>

      <UButton
        icon="i-lucide-trash"
        color="error"
        variant="ghost"
        size="xs"
        @click="deleteAssignment(assignment.id)"
      />
    </div>
  </div>
</template>
