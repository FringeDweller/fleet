<script setup lang="ts">
import type { Asset } from '~/types'

const props = defineProps<{
  initialValues?: Partial<Asset>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: Partial<Asset>): void
  (e: 'cancel'): void
}>()

const { categories, fetchCategories } = useAssets()

const state = reactive({
  assetNumber: props.initialValues?.assetNumber || '',
  make: props.initialValues?.make || '',
  model: props.initialValues?.model || '',
  year: props.initialValues?.year || new Date().getFullYear(),
  vin: props.initialValues?.vin || '',
  licensePlate: props.initialValues?.licensePlate || '',
  categoryId: props.initialValues?.categoryId || '',
  status: props.initialValues?.status || 'active'
})

onMounted(() => {
  fetchCategories()
})

function onSubmit() {
  emit('submit', { ...state })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Asset Number" name="assetNumber" required>
        <UInput v-model="state.assetNumber" placeholder="FLT-001" />
      </UFormField>

      <UFormField label="Category" name="categoryId" required>
        <USelect
          v-model="state.categoryId"
          :items="categories"
          label-key="name"
          value-key="id"
          placeholder="Select category"
        />
      </UFormField>

      <UFormField label="Make" name="make" required>
        <UInput v-model="state.make" placeholder="Toyota" />
      </UFormField>

      <UFormField label="Model" name="model" required>
        <UInput v-model="state.model" placeholder="Hilux" />
      </UFormField>

      <UFormField label="Year" name="year" required>
        <UInput v-model="state.year" type="number" />
      </UFormField>

      <UFormField label="Status" name="status">
        <USelect
          v-model="state.status"
          :items="['active', 'inactive', 'maintenance', 'disposed']"
        />
      </UFormField>

      <UFormField label="VIN" name="vin">
        <UInput v-model="state.vin" placeholder="17-digit VIN" />
      </UFormField>

      <UFormField label="License Plate" name="licensePlate">
        <UInput v-model="state.licensePlate" placeholder="ABC-123" />
      </UFormField>
    </div>

    <div class="flex justify-end gap-3">
      <UButton variant="ghost" @click="$emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" :loading="loading">
        Save
      </UButton>
    </div>
  </form>
</template>
