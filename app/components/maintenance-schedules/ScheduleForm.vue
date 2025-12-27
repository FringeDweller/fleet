<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
  initialData?: Record<string, unknown>
}>()

const emit = defineEmits(['submit'])

const { assets: _assets, categories: _categories, fetchAssets, fetchCategories } = useAssets()
const { tasks: _tasks, fetchTasks } = useMaintenanceTasks()

onMounted(async () => {
  await Promise.all([fetchAssets(), fetchCategories(), fetchTasks()])
})

const _state = ref({
  name: props.initialData?.name || '',
  description: props.initialData?.description || '',
  targetType: props.initialData?.targetType || 'asset',
  assetId: props.initialData?.assetId || null,
  categoryId: props.initialData?.categoryId || null,
  taskId: props.initialData?.taskId || '',
  intervalType: props.initialData?.intervalType || 'meter',
  meterInterval: props.initialData?.meterInterval || null,
  timeIntervalValue: props.initialData?.timeIntervalValue || null,
  timeIntervalUnit: props.initialData?.timeIntervalValue || 'days',
  organizationId: props.initialData?.organizationId || ''
})

async function _onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const data = { ...event.data }

  // Clean up based on targetType
  if (data.targetType === 'asset') data.categoryId = null
  else data.assetId = null

  delete data.targetType

  emit('submit', data)
}
</script>

<template>
  <UForm :state="_state" class="space-y-4" @submit="_onSubmit">
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

      <UFormGroup
        v-if="state.targetType === 'asset'"
        label="Asset"
        name="assetId"
        required
      >
        <USelectMenu
          v-model="state.assetId"
          :options="assets"
          option-attribute="assetNumber"
          value-attribute="id"
          searchable
        />
      </UFormGroup>

      <UFormGroup
        v-else
        label="Category"
        name="categoryId"
        required
      >
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
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="$router.back()"
      />
      <UButton
        type="submit"
        label="Save Schedule"
        color="primary"
        :loading="loading"
      />
    </div>
  </UForm>
</template>
