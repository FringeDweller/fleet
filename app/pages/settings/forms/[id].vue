<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: form } = await useFetch(`/api/settings/forms/${id}`)
</script>

<template>
  <div v-if="form" class="space-y-4">
    <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Edit Form: {{ form.title }}</h2>
        <UButton label="Save" />
    </div>
    
    <div class="p-8 border border-dashed rounded-lg text-center text-dimmed">
        Form Builder UI Placeholder for {{ id }}
        <br>
        (Drag and Drop implementation pending)
    </div>
  </div>
</template>
