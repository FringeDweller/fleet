<script setup lang="ts">
import type { FormField } from '../../../types/form-builder'

const props = defineProps<{
  module: string
  context: Record<string, any>
}>()

const { data: forms } = await useFetch<any[]>('/api/forms/context', {
    query: {
        module: props.module,
        context: JSON.stringify(props.context)
    }
})
</script>

<template>
  <div v-if="forms && forms.length > 0" class="space-y-6">
    <div v-for="form in forms" :key="form.id" class="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
            <h4 class="font-bold text-sm">{{ form.title }}</h4>
            <UButton label="Fill Form" size="xs" variant="soft" icon="i-lucide-edit-3" />
        </div>
        <div class="p-4">
            <p v-if="form.description" class="text-xs text-dimmed mb-4">{{ form.description }}</p>
            <div class="space-y-4 opacity-50 pointer-events-none">
                <!-- Preview of first few fields -->
                <div v-for="field in form.schema.slice(0, 2)" :key="field.id">
                    <UFormGroup :label="field.label">
                        <UInput disabled placeholder="..." />
                    </UFormGroup>
                </div>
                <div v-if="form.schema.length > 2" class="text-xs text-center text-dimmed italic">
                    + {{ form.schema.length - 2 }} more fields
                </div>
            </div>
        </div>
    </div>
  </div>
  <div v-else class="text-center py-12 text-dimmed italic border-2 border-dashed rounded-lg">
    No custom forms assigned to this {{ module }}.
  </div>
</template>
