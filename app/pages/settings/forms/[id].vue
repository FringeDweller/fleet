<script setup lang="ts">
import type { FormField } from '../../../../types/form-builder'

interface CustomForm {
  id: string
  formGroupId: string | null
  version: number
  title: string
  description: string | null
  schema: FormField[]
  status: 'draft' | 'published' | 'archived'
  organizationId: string
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: form, refresh } = await useFetch<CustomForm>(`/api/settings/forms/${id}`)

const { data: versions, refresh: refreshVersions } = await useFetch<CustomForm[]>(`/api/settings/forms/${id}/versions`)

const items = [
  { label: 'Builder', icon: 'i-lucide-layout-template', slot: 'builder' },
  { label: 'Assignments', icon: 'i-lucide-link', slot: 'assignments' },
  { label: 'Versions', icon: 'i-lucide-history', slot: 'versions' },
  { label: 'Submissions', icon: 'i-lucide-database', slot: 'submissions' }
]

const formFields = ref<FormField[]>([])
const isSaving = ref(false)
const isPublishing = ref(false)
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
    const res = await $fetch<CustomForm>(`/api/settings/forms/${id}`, {
      method: 'PUT',
      body: {
        schema: formFields.value,
        title: form.value?.title
      }
    })

    if (res.id !== id) {
      // New version was created (because we saved changes to a published form)
      toast.add({ title: 'New draft version created', color: 'success' })
      navigateTo(`/settings/forms/${res.id}`)
    } else {
      toast.add({ title: 'Form saved successfully', color: 'success' })
      refresh()
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save form', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function publishForm() {
  isPublishing.value = true
  try {
    await $fetch(`/api/settings/forms/${id}/publish`, { method: 'POST' })
    toast.add({ title: 'Form published successfully', color: 'success' })
    refresh()
    refreshVersions()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to publish form', color: 'error' })
  } finally {
    isPublishing.value = false
  }
}

async function rollback(versionId: string) {
  try {
    await $fetch(`/api/settings/forms/${versionId}/rollback`, { method: 'POST' })
    toast.add({ title: 'Rolled back to this version', color: 'success' })
    if (versionId !== id) {
      navigateTo(`/settings/forms/${versionId}`)
    } else {
      refresh()
      refreshVersions()
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to rollback', color: 'error' })
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
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to add assignment', color: 'error' })
  }
}

// Allow editing title directly
const editTitle = ref(false)
const titleInput = ref('')

function startTitleEdit() {
  titleInput.value = (form.value?.title as string) || ''
  editTitle.value = true
}

async function saveTitle() {
  if (form.value && titleInput.value !== form.value.title) {
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
          <h2 class="text-xl font-bold">
            {{ form.title }}
          </h2>
          <UIcon name="i-lucide-edit-2" class="w-4 h-4 opacity-0 group-hover:opacity-100 text-dimmed" />
        </div>
        <div v-else class="flex items-center gap-2">
          <UInput v-model="titleInput" autofocus @keyup.enter="saveTitle" />
          <UButton
            icon="i-lucide-check"
            size="xs"
            variant="soft"
            @click="saveTitle"
          />
        </div>
        <UBadge :color="form.status === 'published' ? 'success' : 'neutral'" variant="subtle" class="ml-2">
          {{ form.status }}
        </UBadge>
      </div>
      <div class="flex gap-2">
        <UButton
          label="Preview"
          variant="ghost"
          icon="i-lucide-eye"
          @click="showPreview = true"
        />
        <UButton
          v-if="form.status === 'draft'"
          label="Publish"
          icon="i-lucide-send"
          color="success"
          variant="soft"
          :loading="isPublishing"
          @click="publishForm"
        />
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
              <h3 class="text-lg font-bold">
                Form Assignments
              </h3>
              <UButton label="Add Assignment" icon="i-lucide-plus" @click="showAssignModal = true" />
            </div>

            <FormAssignmentsList ref="assignmentsList" :form-id="id" />

            <UModal v-model="showAssignModal">
              <div class="p-6 space-y-4">
                <h3 class="font-bold">
                  New Assignment
                </h3>
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

        <template #versions>
          <div class="p-6 max-w-4xl mx-auto w-full overflow-y-auto">
            <h3 class="text-lg font-bold mb-4">
              Form Versions
            </h3>
            <div class="space-y-4">
              <div
                v-for="v in versions"
                :key="v.id"
                class="p-4 border rounded-lg flex justify-between items-center bg-white dark:bg-gray-900"
                :class="{ 'ring-2 ring-primary-500': v.id === id }"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold">Version {{ v.version }}</span>
                    <UBadge
                      :color="v.status === 'published' ? 'success' : v.status === 'draft' ? 'neutral' : 'neutral'"
                      size="xs"
                      variant="subtle"
                    >
                      {{ v.status }}
                    </UBadge>
                    <span v-if="v.id === id" class="text-xs text-primary-500 font-medium">(Current)</span>
                  </div>
                  <p class="text-xs text-dimmed mt-1">
                    Updated {{ new Date(v.updatedAt).toLocaleString() }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <UButton
                    v-if="v.id !== id"
                    label="View"
                    size="xs"
                    variant="ghost"
                    icon="i-lucide-eye"
                    :to="`/settings/forms/${v.id}`"
                  />
                  <UButton
                    v-if="v.status !== 'published'"
                    label="Rollback"
                    size="xs"
                    variant="soft"
                    color="neutral"
                    icon="i-lucide-rotate-ccw"
                    @click="rollback(v.id)"
                  />
                </div>
              </div>
            </div>
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
          <h3 class="text-xl font-bold">
            Preview: {{ form.title }}
          </h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            @click="showPreview = false"
          />
        </div>
        <FormsFormRenderer :form-id="id" :fields="formFields" />
        <div class="flex justify-end pt-4 border-t mt-6">
          <UButton label="Close Preview" @click="showPreview = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>
