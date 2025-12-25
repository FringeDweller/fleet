<script setup lang="ts">
import FormBuilder from '../../../components/forms/FormBuilder.vue'
import type { FormField } from '../../../../types/form-builder'

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: form, refresh } = await useFetch<any>(`/api/settings/forms/${id}`)

const formFields = ref<FormField[]>([])
const isSaving = ref(false)

// Initialize fields from loaded form
watchEffect(() => {
  if (form.value?.schema) {
    // Ensure deep clone to avoid mutation issues before edit
    formFields.value = JSON.parse(JSON.stringify(form.value.schema))
  }
})

async function saveForm() {
  isSaving.value = true
  try {
    await $fetch(`/api/settings/forms/${id}`, {
      method: 'PUT',
      body: {
        schema: formFields.value,
        title: form.value?.title // Preserve title or bind it if editable
      }
    })
    toast.add({ title: 'Form saved successfully', color: 'success' })
    refresh()
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Failed to save form', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

// Allow editing title directly here too
const editTitle = ref(false)
const titleInput = ref('')

function startTitleEdit() {
    titleInput.value = form.value?.title || ''
    editTitle.value = true
}

async function saveTitle() {
    if (titleInput.value !== form.value?.title) {
        form.value.title = titleInput.value // Optimistic update
        await $fetch(`/api/settings/forms/${id}`, {
             method: 'PUT',
             body: { title: titleInput.value }
        })
    }
    editTitle.value = false
}
</script>

<template>
  <div v-if="form" class="h-[calc(100vh-64px)] flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4 px-1">
        <div class="flex items-center gap-2">
            <UButton icon="i-lucide-arrow-left" variant="ghost" to="/settings/forms" />
            <div v-if="!editTitle" class="flex items-center gap-2 group cursor-pointer" @click="startTitleEdit">
                <h2 class="text-xl font-bold">{{ form.title }}</h2>
                <UIcon name="i-lucide-edit-2" class="w-4 h-4 opacity-0 group-hover:opacity-100 text-dimmed" />
            </div>
            <div v-else class="flex items-center gap-2">
                <UInput v-model="titleInput" @keyup.enter="saveTitle" autofocus />
                <UButton icon="i-lucide-check" size="xs" variant="soft" @click="saveTitle" />
            </div>
            <UBadge :color="form.status === 'published' ? 'success' : 'neutral'" variant="subtle" class="ml-2">
                {{ form.status }}
            </UBadge>
        </div>
        <div class="flex gap-2">
            <UButton label="Preview" variant="ghost" icon="i-lucide-eye" />
            <UButton 
                label="Save Changes" 
                icon="i-lucide-save" 
                :loading="isSaving" 
                @click="saveForm" 
            />
        </div>
    </div>
    
    <!-- Builder -->
    <div class="flex-1 overflow-hidden">
        <FormBuilder v-model="formFields" />
    </div>
  </div>
</template>