<script setup lang="ts">
const { categories, fetchCategories, createPart } = useInventory()
const toast = useToast()
const router = useRouter()

await fetchCategories()

const state = reactive({
  sku: '',
  name: '',
  description: '',
  unit: 'pcs',
  categoryId: undefined,
  reorderThreshold: '0',
  reorderQuantity: '0',
  unitCost: '0'
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await createPart(state)
    toast.add({
      title: 'Part created',
      color: 'success'
    })
    router.push('/inventory')
  } catch (error: any) {
    toast.add({
      title: 'Error creating part',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="New Part">
        <template #left>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inventory"
          />
        </template>
      </UDashboardNavbar>

      <div class="p-4 max-w-2xl">
        <UForm :state="state" @submit="onSubmit" class="space-y-4">
          <UFormGroup label="SKU" name="sku" required>
            <UInput v-model="state.sku" placeholder="e.g. PART-123" />
          </UFormGroup>

          <UFormGroup label="Name" name="name" required>
            <UInput v-model="state.name" placeholder="Part Name" />
          </UFormGroup>

          <UFormGroup label="Description" name="description">
            <UTextarea v-model="state.description" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Unit" name="unit" required>
              <UInput v-model="state.unit" placeholder="e.g. pcs, liters, kg" />
            </UFormGroup>

            <UFormGroup label="Category" name="categoryId">
              <USelect
                v-model="state.categoryId"
                :options="categories.map(c => ({ label: c.name, value: c.id }))"
                placeholder="Select category"
              />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <UFormGroup label="Unit Cost" name="unitCost">
              <UInput v-model="state.unitCost" type="number" step="0.01" />
            </UFormGroup>

            <UFormGroup label="Reorder Threshold" name="reorderThreshold">
              <UInput v-model="state.reorderThreshold" type="number" step="0.01" />
            </UFormGroup>

            <UFormGroup label="Reorder Quantity" name="reorderQuantity">
              <UInput v-model="state.reorderQuantity" type="number" step="0.01" />
            </UFormGroup>
          </div>

          <div class="flex justify-end gap-4">
            <UButton color="neutral" variant="ghost" to="/inventory">
              Cancel
            </UButton>
            <UButton type="submit" color="primary" :loading="loading">
              Create Part
            </UButton>
          </div>
        </UForm>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
