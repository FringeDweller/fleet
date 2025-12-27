<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: _inspection, pending: _pending } = await useFetch<unknown>(`/api/inspections/${id}`)

const _getStatusColor = (status: string) => {
  switch (status) {
    case 'passed':
      return 'success'
    case 'failed':
      return 'error'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <div class="p-4 space-y-6">
    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-lucide-loader" class="animate-spin text-2xl" />
    </div>

    <div v-else-if="inspection" class="space-y-6">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          to="/inspections"
        />
        <h1 class="text-2xl font-bold">
          Inspection Details
        </h1>
        <UBadge :color="getStatusColor(inspection.status as string)" size="lg" class="ml-auto capitalize">
          {{ inspection.status }}
        </UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold">
              General Information
            </h3>
          </template>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-dimmed">
                Date:
              </dt>
              <dd>{{ new Date(inspection.createdAt as string).toLocaleString() }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-dimmed">
                Operator ID:
              </dt>
              <dd>{{ inspection.operatorId }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-dimmed">
                Asset ID:
              </dt>
              <dd>{{ inspection.assetId }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Walk-Around Verification
            </h3>
          </template>
          <p class="text-sm">
            Checkpoints Scanned: {{ (inspection.checkpoints as any[])?.length || 0 }}
          </p>
          <ul class="mt-2 space-y-1">
            <li v-for="(cp, i) in (inspection.checkpoints as any[])" :key="i" class="text-xs text-dimmed flex justify-between">
              <span>Checkpoint {{ cp.id }}</span>
              <span>{{ new Date(cp.timestamp).toLocaleTimeString() }}</span>
            </li>
          </ul>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold">
            Checklist Results
          </h3>
        </template>
        <div class="space-y-4">
          <div v-for="item in (inspection.results as any[])" :key="item.id" class="border-b border-default pb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ item.label }}</span>
              <UBadge
                :color="getStatusColor(item.status as string)"
                variant="soft"
                size="sm"
                class="capitalize"
              >
                {{ item.status }}
              </UBadge>
            </div>
            <div v-if="item.status === 'failed'" class="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg space-y-2">
              <p class="text-sm text-red-800 dark:text-red-200">
                <span class="font-bold">Comment:</span> {{ item.comment }}
              </p>
              <div v-if="item.photo" class="w-full max-w-sm rounded-lg overflow-hidden border border-red-200">
                <img :src="item.photo as string" class="w-full h-auto">
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard v-if="inspection.signatureUrl">
        <template #header>
          <h3 class="font-semibold">
            Operator Sign-off
          </h3>
        </template>
        <div class="flex flex-col items-center p-4">
          <p class="text-xs text-dimmed italic mb-4">
            Digitally signed by operator
          </p>
          <div class="h-20 flex items-center justify-center border-b border-default w-64">
            <span class="text-3xl font-signature italic">John Doe</span>
          </div>
        </div>
      </UCard>

      <div class="space-y-4">
        <h3 class="text-lg font-bold">
          Additional Forms
        </h3>
        <FormsContextForms module="inspections" :context="{ id, assetId: inspection.assetId as string, status: inspection.status as string }" />
      </div>
    </div>
  </div>
</template>
