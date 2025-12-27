<script setup lang="ts">
const props = defineProps<{
  formId: string
}>()

const { data: assignments, refresh } = await useFetch<Record<string, unknown>[]>(
  '/api/settings/forms/assignments',
  {
    query: { formId: props.formId }
  }
)

// biome-ignore lint:  vue/no-expose-after-await
defineExpose({ refresh })

async function _deleteAssignment(id: string) {
  // biome-ignore lint:  @typescript-eslint/no-explicit-any
  await $fetch(`/api/settings/forms/assignments/${id}`, { method: 'DELETE' as any })
  refresh()
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="assignments && assignments.length > 0" class="border rounded-lg divide-y bg-white dark:bg-gray-900">
      <div v-for="a in assignments" :key="a.id as string" class="p-4 flex justify-between items-center">
        <div>
          <div class="font-medium capitalize">
            {{ (a.targetModule as string).replace('_', ' ') }}
          </div>
          <div v-if="a.conditions && Object.keys(a.conditions as object).length > 0" class="text-xs text-dimmed mt-1">
            Conditions: {{ JSON.stringify(a.conditions) }}
          </div>
          <div v-else class="text-xs text-dimmed mt-1">
            Always active for this module
          </div>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          @click="deleteAssignment(a.id as string)"
        />
      </div>
    </div>

    <div v-else class="text-center py-12 border-2 border-dashed rounded-lg text-dimmed">
      No assignments yet. This form won't appear anywhere.
    </div>
  </div>
</template>
