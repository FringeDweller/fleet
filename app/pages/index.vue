<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { sub } from 'date-fns'
import { VueDraggable } from 'vue-draggable-plus'
import type { DashboardConfig, Period, Range, WidgetConfig } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const toast = useToast()

const { data: config, refresh: refreshConfig } =
  await useFetch<DashboardConfig>('/api/dashboard/config')
const layout = ref<WidgetConfig[]>([])

watchEffect(() => {
  if (config.value?.layout) {
    layout.value = JSON.parse(JSON.stringify(config.value.layout))
  }
})

const isEditMode = ref(false)
const isSaving = ref(false)

// biome-ignore lint:  @typescript-eslint/no-explicit-any
const widgetComponents: Record<string, any> = {
  DashboardStats: resolveComponent('DashboardStats'),
  HomeChart: resolveComponent('HomeChart'),
  HomeSales: resolveComponent('HomeSales'),
  HomeLowStock: resolveComponent('HomeLowStock'),
  HomeFuelAnomalyWidget: resolveComponent('HomeFuelAnomalyWidget')
}

async function saveLayout() {
  isSaving.value = true
  try {
    await $fetch('/api/dashboard/config', {
      method: 'PUT',
      body: { layout: layout.value }
    })
    toast.add({ title: 'Dashboard layout saved', color: 'success' })
    isEditMode.value = false
    refreshConfig()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save layout', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

function removeWidget(id: string) {
  layout.value = layout.value.filter((w) => w.id !== id)
}

const availableWidgets = [
  { id: 'stats', type: 'DashboardStats', label: 'KPI Stats', icon: 'i-lucide-layout-grid' },
  { id: 'chart', type: 'HomeChart', label: 'Performance Chart', icon: 'i-lucide-line-chart' },
  { id: 'sales', type: 'HomeSales', label: 'Recent Sales', icon: 'i-lucide-shopping-cart' },
  { id: 'inventory', type: 'HomeLowStock', label: 'Low Stock', icon: 'i-lucide-package' },
  { id: 'fuel', type: 'HomeFuelAnomalyWidget', label: 'Fuel Anomalies', icon: 'i-lucide-fuel' }
]

function addWidget(widget: (typeof availableWidgets)[0]) {
  const id = `${widget.id}_${Date.now()}`
  layout.value.push({
    id,
    type: widget.type,
    w: 4,
    h: 4,
    settings: {}
  })
}

const items = [
  [
    {
      label: 'New mail',
      icon: 'i-lucide-send',
      to: '/inbox'
    },
    {
      label: 'New customer',
      icon: 'i-lucide-user-plus',
      to: '/customers'
    }
  ]
] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="!isEditMode"
            label="Edit Dashboard"
            icon="i-lucide-layout-dashboard"
            variant="ghost"
            color="neutral"
            @click="isEditMode = true"
          />
          <div v-else class="flex gap-2">
            <UDropdownMenu :items="[availableWidgets.map(w => ({ label: w.label, icon: w.icon, onSelect: () => addWidget(w) }))]">
              <UButton
                label="Add Widget"
                icon="i-lucide-plus"
                variant="soft"
                color="neutral"
              />
            </UDropdownMenu>
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              @click="isEditMode = false"
            />
            <UButton
              label="Save Layout"
              icon="i-lucide-save"
              :loading="isSaving"
              @click="saveLayout"
            />
          </div>

          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <VueDraggable
        v-model="layout"
        :disabled="!isEditMode"
        handle=".drag-handle"
        class="grid grid-cols-12 gap-4"
      >
        <div
          v-for="widget in layout"
          :key="widget.id"
          :class="[
            widget.w === 12 ? 'col-span-12' : widget.w === 4 ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-6',
            'relative group'
          ]"
        >
          <div
            v-if="isEditMode"
            class="absolute -top-2 -right-2 z-20 flex gap-1"
          >
            <UButton
              icon="i-lucide-move"
              size="xs"
              color="neutral"
              variant="solid"
              class="drag-handle cursor-move rounded-full"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="error"
              variant="solid"
              class="rounded-full"
              @click="removeWidget(widget.id)"
            />
          </div>

          <component
            :is="widgetComponents[widget.type]"
            v-bind="{ period, range, ...widget.settings }"
            :class="{ 'opacity-50 pointer-events-none ring-2 ring-primary-500 rounded-lg': isEditMode }"
          />
        </div>
      </VueDraggable>
    </template>
  </UDashboardPanel>
</template>
