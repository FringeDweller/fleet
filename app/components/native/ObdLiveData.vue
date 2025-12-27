<script setup lang="ts">
import { useBluetoothObd } from '~/composables/useBluetoothObd'

const { liveData, isConnected } = useBluetoothObd()
</script>

<template>
  <div v-if="isConnected" class="grid grid-cols-2 gap-4">
    <UCard>
      <div class="text-center">
        <p class="text-xs text-dimmed uppercase font-bold">
          RPM
        </p>
        <p class="text-2xl font-mono">
          {{ liveData.rpm }}
        </p>
      </div>
    </UCard>
    <UCard>
      <div class="text-center">
        <p class="text-xs text-dimmed uppercase font-bold">
          Speed
        </p>
        <p class="text-2xl font-mono">
          {{ liveData.speed }} <span class="text-xs">km/h</span>
        </p>
      </div>
    </UCard>
    <UCard>
      <div class="text-center">
        <p class="text-xs text-dimmed uppercase font-bold">
          Temp
        </p>
        <p class="text-2xl font-mono">
          {{ liveData.temp }} <span class="text-xs">°C</span>
        </p>
      </div>
    </UCard>
    <UCard>
      <div class="text-center">
        <p class="text-xs text-dimmed uppercase font-bold">
          Fuel
        </p>
        <p class="text-2xl font-mono">
          {{ liveData.fuel }} <span class="text-xs">%</span>
        </p>
      </div>
    </UCard>
  </div>
</template>
