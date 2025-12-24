<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { categories, fetchCategories } = useAssets()
const loading = ref(false)
const toast = useToast()

const state = reactive({
  assetNumber: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  categoryId: '',
  status: 'active'
})

onMounted(() => {
  fetchCategories()
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/assets', {
      method: 'POST',
      body: state
    })
    toast.add({
      title: 'Success',
      description: 'Asset created successfully',
      color: 'success'
    })
    await navigateTo('/assets')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create asset',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="new-asset">
    <template #header>
      <UDashboardNavbar title="New Asset">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/assets" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard class="max-w-2xl mx-auto">
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
            <UButton variant="ghost" to="/assets">
              Cancel
            </UButton>
            <UButton type="submit" :loading="loading">
              Create Asset
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
