<script setup lang="ts">
import type { FormField, Condition } from '../../../types/form-builder'

const props = defineProps<{
  fields: FormField[]
}>()

const formData = ref<Record<string, any>>({})

// Initialize form data
watch(() => props.fields, (newFields) => {
  newFields.forEach(f => {
    if (formData.value[f.key] === undefined) {
      if (f.type === 'checkbox') formData.value[f.key] = false
      else if (f.type === 'select') formData.value[f.key] = f.options?.[0]?.value || ''
      else formData.value[f.key] = ''
    }
  })
}, { immediate: true })

function isVisible(field: FormField) {
  if (!field.logic || !field.logic.conditions.length) return true

  const { action, match, conditions } = field.logic
  
  const results = conditions.map(cond => {
    const val = formData.value[cond.field]
    switch (cond.operator) {
      case 'eq': return val === cond.value
      case 'neq': return val !== cond.value
      case 'contains': return String(val).includes(cond.value)
      case 'gt': return Number(val) > Number(cond.value)
      case 'lt': return Number(val) < Number(cond.value)
      default: return true
    }
  })

  const isMatched = match === 'all' 
    ? results.every(r => r) 
    : results.some(r => r)

  return action === 'show' ? isMatched : !isMatched
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="field in fields" :key="field.id">
      <div v-if="isVisible(field)">
        <div v-if="field.type === 'section'" class="border-b pb-2 mb-2 pt-4">
          <h3 class="text-lg font-bold">{{ field.label }}</h3>
        </div>
        
        <UFormGroup 
          v-else
          :label="field.label" 
          :required="field.required"
          :help="field.helpText"
        >
          <UInput v-if="['text', 'number', 'date', 'time'].includes(field.type)" v-model="formData[field.key]" :type="field.type === 'number' ? 'number' : 'text'" />
          <UTextarea v-else-if="field.type === 'textarea'" v-model="formData[field.key]" />
          <USelect v-else-if="field.type === 'select'" v-model="formData[field.key]" :options="field.options || []" />
          <UCheckbox v-else-if="field.type === 'checkbox'" v-model="formData[field.key]" :label="field.label" />
          <div v-else-if="field.type === 'photo'" class="h-32 bg-gray-50 dark:bg-gray-800 rounded border border-dashed flex flex-col items-center justify-center text-dimmed">
            <UIcon name="i-lucide-camera" class="w-8 h-8 mb-2" />
            <span class="text-xs">Click to upload photo</span>
          </div>
          <div v-else-if="field.type === 'signature'" class="h-32 bg-gray-50 dark:bg-gray-800 rounded border border-dashed flex flex-col items-center justify-center text-dimmed">
            <UIcon name="i-lucide-pen-tool" class="w-8 h-8 mb-2" />
            <span class="text-xs">Touch to sign</span>
          </div>
        </UFormGroup>
      </div>
    </div>
  </div>
</template>
