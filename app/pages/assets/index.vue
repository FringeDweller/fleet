<script setup lang="ts">
import type { Asset } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const { assets, loading, fetchAssets } = useAssets()
const { scan: scanQr } = useQrScanner()

async function onScan() {
  const barcode = await scanQr()
  if (barcode?.displayValue) {
    // Assuming barcode contains asset ID or number
    await navigateTo(`/assets/${barcode.displayValue}`)
  }
}

const search = ref('')
const columns = [
  { key: 'assetNumber', label: 'Asset #' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'status', label: 'Status' }
] as const

const filteredAssets = computed(() => {
  if (!search.value) return assets.value
  return assets.value.filter((asset: Asset) => 
    Object.values(asset).some(val => 
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

onMounted(() => {
  fetchAssets()
})
</script>

<template>
  <UDashboardPanel id="assets">
    <template #header>
      <UDashboardNavbar title="Assets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-scan" color="neutral" variant="ghost" class="md:hidden" @click="onScan" />
          <UButton icon="i-lucide-plus" label="New Asset" to="/assets/new" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search assets..."
            class="w-64"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :rows="filteredAssets"
        :columns="(columns as any)"
        :loading="loading"
        class="w-full"
      >
        <template #status-data="{ row }">
          <UBadge
            :color="(row as any).status === 'active' ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ (row as any).status }}
          </UBadge>
        </template>
        
        <template #assetNumber-data="{ row }">
          <NuxtLink :to="`/assets/${(row as any).id}`" class="text-primary hover:underline font-medium">
            {{ (row as any).assetNumber }}
          </NuxtLink>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
