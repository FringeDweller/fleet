<script setup lang="ts">
import FormBuilder from '../../../components/forms/FormBuilder.vue'
import FormRenderer from '../../../components/forms/FormRenderer.vue'
import FormAssignmentsList from '../../../components/forms/FormAssignmentsList.vue'
import FormSubmissionsTable from '../../../components/forms/FormSubmissionsTable.vue'
import type { FormField } from '../../../../types/form-builder'

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: form, refresh } = await useFetch<any>(`/api/settings/forms/${id}`)

const items = [
  { label: 'Builder', icon: 'i-lucide-layout-template', slot: 'builder' },
  { label: 'Assignments', icon: 'i-lucide-link', slot: 'assignments' },
  { label: 'Submissions', icon: 'i-lucide-database', slot: 'submissions' }
]

const formFields = ref<FormField[]>([])
const isSaving = ref(false)
const showPreview = ref(false)
const showAssignModal = ref(false)
const assignmentsList = ref()

const newAssignment = ref({
  targetModule: 'assets',
  conditions: {}
})

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
        title: form.value?.title
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

async function saveAssignment() {
  try {
    await $fetch('/api/settings/forms/assignments', {
      method: 'POST',
      body: {
        ...newAssignment.value,
        formId: id
      }
    })
    showAssignModal.value = false
    toast.add({ title: 'Assignment added', color: 'success' })
    assignmentsList.value?.refresh()
  } catch (e) {
    toast.add({ title: 'Failed to add assignment', color: 'error' })
  }
}

// Allow editing title directly
const editTitle = ref(false)
const titleInput = ref('')

function startTitleEdit() {
    titleInput.value = form.value?.title || ''
    editTitle.value = true
}

async function saveTitle() {
    if (titleInput.value !== form.value?.title) {
        form.value.title = titleInput.value
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
            <UButton label="Preview" variant="ghost" icon="i-lucide-eye" @click="showPreview = true" />
            <UButton 
                label="Save Changes" 
                icon="i-lucide-save" 
                :loading="isSaving" 
                @click="saveForm" 
            />
        </div>
    </div>
    
    <!-- Tabs -->
    <div class="flex-1 overflow-hidden flex flex-col">
        <UTabs :items="items" class="flex-1 flex flex-col overflow-hidden">
            <template #builder>
                <div class="flex-1 overflow-hidden">
                    <FormBuilder v-model="formFields" />
                </div>
            </template>
            
            <template #assignments>
                <div class="p-6 space-y-6 max-w-4xl mx-auto w-full overflow-y-auto">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold">Form Assignments</h3>
                        <UButton label="Add Assignment" icon="i-lucide-plus" @click="showAssignModal = true" />
                    </div>
                    
                    <FormAssignmentsList ref="assignmentsList" :form-id="id" />
                    
                    <UModal v-model="showAssignModal">
                        <div class="p-6 space-y-4">
                            <h3 class="font-bold">New Assignment</h3>
                            <UFormGroup label="Target Module">
                                <USelect 
                                    v-model="newAssignment.targetModule" 
                                    :options="[
                                        { label: 'Assets', value: 'assets' },
                                        { label: 'Work Orders', value: 'work_orders' },
                                        { label: 'Inspections', value: 'inspections' },
                                        { label: 'Operators', value: 'operators' }
                                    ]" 
                                />
                            </UFormGroup>
                            
                            <div class="flex justify-end gap-2">
                                <UButton label="Cancel" variant="ghost" @click="showAssignModal = false" />
                                <UButton label="Save" @click="saveAssignment" />
                            </div>
                        </div>
                    </UModal>
                </div>
            </template>

            <template #submissions>
                <div class="p-6">
                    <FormsFormSubmissionsTable :form-id="id" :schema="formFields" />
                </div>
            </template>
        </UTabs>
    </div>

    <!-- Preview Modal -->
    <UModal v-model="showPreview">
        <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center border-b pb-4 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h3 class="text-xl font-bold">Preview: {{ form.title }}</h3>
                <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="showPreview = false" />
            </div>
            <FormsFormRenderer :form-id="id" :fields="formFields" />
            <div class="flex justify-end pt-4 border-t mt-6">
                <UButton label="Close Preview" @click="showPreview = false" />
            </div>
        </div>
    </UModal>
  </div>
</template>