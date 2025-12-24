<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  initialData?: any
  loading?: boolean
}>()

const emit = defineEmits(['submit'])

const { assets, categories, fetchAssets, fetchCategories } = useAssets()
const { tasks, fetchTasks } = useMaintenanceTasks()

onMounted(async () => {
  await Promise.all([fetchAssets(), fetchCategories(), fetchTasks()])
})

const state = reactive({
  name: props.initialData?.name || '',
  taskId: props.initialData?.taskId || '',
  targetType: props.initialData?.categoryId ? 'category' : (props.initialData?.assetId ? 'asset' : 'asset'),
  assetId: props.initialData?.assetId || '',
  categoryId: props.initialData?.categoryId || '',
  type: props.initialData?.type || 'time',
  timeInterval: props.initialData?.timeInterval || 0,
  timeUnit: props.initialData?.timeUnit || 'months',
  usageIntervalKm: props.initialData?.usageIntervalKm ? Number(props.initialData?.usageIntervalKm) : 0,
  usageIntervalHours: props.initialData?.usageIntervalHours ? Number(props.initialData?.usageIntervalHours) : 0,
  leadTimeDays: props.initialData?.leadTimeDays || 7,
  isActive: props.initialData?.isActive ?? true
})

const schema = z.object({
  name: z.string().min(3, 'Name is required'),
  taskId: z.string().min(1, 'Task is required'),
  targetType: z.enum(['asset', 'category']),
  assetId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['time', 'usage', 'combined']),
  timeInterval: z.number().optional(),
  timeUnit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  usageIntervalKm: z.number().optional(),
  usageIntervalHours: z.number().optional(),
  leadTimeDays: z.number().min(1)
}).refine(data => {
  if (data.targetType === 'asset' && !data.assetId) return false
  if (data.targetType === 'category' && !data.categoryId) return false
  return true
}, {
  message: "Target is required",
  path: ["assetId"] 
})

async function onSubmit(event: FormSubmitEvent<any>) {
  const data = { ...event.data }
  // Clean up based on targetType
  if (data.targetType === 'asset') data.categoryId = null
  else data.assetId = null
  
  delete data.targetType 
  
  emit('submit', data)
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormGroup label="Schedule Name" name="name" required>
      <UInput v-model="state.name" />
    </UFormGroup>

    <UFormGroup label="Maintenance Task" name="taskId" required>
      <USelectMenu
        v-model="state.taskId"
        :options="tasks"
        option-attribute="name"
        value-attribute="id"
        searchable
      />
    </UFormGroup>

    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="Target Type" name="targetType">
        <URadioGroup v-model="state.targetType" :options="[{ label: 'Specific Asset', value: 'asset' }, { label: 'Asset Category', value: 'category' }]" />
      </UFormGroup>
      
      <UFormGroup v-if="state.targetType === 'asset'" label="Asset" name="assetId" required>
        <USelectMenu
          v-model="state.assetId"
          :options="assets"
          option-attribute="assetNumber"
          value-attribute="id"
          searchable
        />
      </UFormGroup>
      
      <UFormGroup v-else label="Category" name="categoryId" required>
        <USelectMenu
          v-model="state.categoryId"
          :options="categories"
          option-attribute="name"
          value-attribute="id"
        />
      </UFormGroup>
    </div>

    <UFormGroup label="Schedule Type" name="type">
       <URadioGroup v-model="state.type" :options="['time', 'usage', 'combined']" />
    </UFormGroup>

    <div v-if="state.type === 'time' || state.type === 'combined'" class="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <UFormGroup label="Every" name="timeInterval">
         <UInput v-model.number="state.timeInterval" type="number" />
      </UFormGroup>
      <UFormGroup label="Unit" name="timeUnit">
         <USelect v-model="state.timeUnit" :options="['days', 'weeks', 'months', 'years']" />
      </UFormGroup>
    </div>

    <div v-if="state.type === 'usage' || state.type === 'combined'" class="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <UFormGroup label="Interval (km)" name="usageIntervalKm">
         <UInput v-model.number="state.usageIntervalKm" type="number" />
      </UFormGroup>
      <UFormGroup label="Interval (Hours)" name="usageIntervalHours">
         <UInput v-model.number="state.usageIntervalHours" type="number" />
      </UFormGroup>
    </div>

    <UFormGroup label="Lead Time (Days)" name="leadTimeDays" help="Create work order X days before due">
      <UInput v-model.number="state.leadTimeDays" type="number" />
    </UFormGroup>
    
    <UFormGroup name="isActive">
      <UCheckbox v-model="state.isActive" label="Active" />
    </UFormGroup>

    <div class="flex justify-end gap-2">
      <UButton label="Cancel" color="gray" variant="ghost" @click="$router.back()" />
      <UButton type="submit" label="Save Schedule" color="primary" :loading="loading" />
    </div>
  </UForm>
</template>
