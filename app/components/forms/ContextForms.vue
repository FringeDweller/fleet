<script setup lang="ts">
import type { FormField } from '~/../types/form-builder'

const props = defineProps<{
  module: string
  context: Record<string, unknown>
}>()

const { data: forms } = await useFetch<Record<string, unknown>[]>('/api/forms/context', {
  query: {
    module: props.module,
    context: JSON.stringify(props.context)
  }
})

const { data: submissions, refresh: refreshSubmissions } = await useFetch<
  Record<string, unknown>[]
>('/api/forms/submissions', {
  query: {
    targetModule: props.module,
    targetId: props.context.id
  }
})
const selectedForm = ref<Record<string, unknown> | null>(null)

const showFormModal = ref(false)

function openForm(form: Record<string, unknown>) {
  selectedForm.value = form

  showFormModal.value = true
}

function onSubmitted() {
  showFormModal.value = false

  selectedForm.value = null

  refreshSubmissions()
}

const selectedSubmission = ref<Record<string, unknown> | null>(null)

const showSubmissionModal = ref(false)

function viewSubmission(sub: Record<string, unknown>) {
  selectedSubmission.value = sub

  showSubmissionModal.value = true
}
</script>

<template>
  <div class="space-y-8">
    <!-- Available Forms -->
    <div v-if="forms && forms.length > 0" class="space-y-4">
      <h3 class="text-sm font-bold uppercase tracking-wider text-dimmed px-1">
        Available Forms
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="form in forms" :key="form.id as string" class="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden flex flex-col shadow-sm">
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
            <h4 class="font-bold text-sm">
              {{ form.title }}
            </h4>
            <UButton
              label="Fill"
              size="xs"
              variant="soft"
              icon="i-lucide-edit-3"
              @click="openForm(form)"
            />
          </div>
          <div class="p-4 flex-1">
            <p v-if="form.description" class="text-xs text-dimmed line-clamp-2">
              {{ form.description }}
            </p>
            <p v-else class="text-xs text-dimmed italic">
              No description provided.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Previous Submissions -->
    <div v-if="submissions && submissions.length > 0" class="space-y-4">
      <h3 class="text-sm font-bold uppercase tracking-wider text-dimmed px-1">
        Previous Submissions
      </h3>
      <div class="border rounded-lg divide-y bg-white dark:bg-gray-900 shadow-sm">
        <div
          v-for="sub in submissions"
          :key="sub.id as string"
          class="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
          @click="viewSubmission(sub)"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-500">
              <UIcon name="i-lucide-file-text" class="w-4 h-4" />
            </div>
            <div>
              <div class="font-medium text-sm">
                Submission on {{ new Date(sub.createdAt as string).toLocaleString() }}
              </div>
              <div class="text-xs text-dimmed flex gap-2">
                <span>By User {{ (sub.submittedBy as string).slice(0, 8) }}</span>
              </div>
            </div>
          </div>
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            size="xs"
            color="neutral"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>

    <div v-if="(!forms || forms.length === 0) && (!submissions || submissions.length === 0)" class="text-center py-12 text-dimmed italic border-2 border-dashed rounded-lg">
      No custom forms or submissions for this {{ module.replace('_', ' ') }}.
    </div>

    <!-- Fill Form Modal -->
    <UModal v-model="showFormModal">
      <div class="p-6">
        <div class="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 class="text-xl font-bold">
            {{ selectedForm?.title }}
          </h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            @click="showFormModal = false"
          />
        </div>

        <FormsFormRenderer
          v-if="selectedForm"
          :form-id="selectedForm.id as string"
          :fields="selectedForm.schema as FormField[]"
          :target-module="module"
          :target-id="context.id as string"
          @submitted="onSubmitted"
        />
      </div>
    </UModal>

    <!-- View Submission Modal -->
    <UModal v-model="showSubmissionModal">
      <div class="p-6">
        <div class="flex justify-between items-center border-b pb-4 mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 class="text-xl font-bold">
            Form Submission
          </h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            @click="showSubmissionModal = false"
          />
        </div>

        <div v-if="selectedSubmission" class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div class="grid grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border">
            <div><span class="text-dimmed font-bold uppercase mr-1">Submitted:</span> {{ new Date(selectedSubmission.createdAt as string).toLocaleString() }}</div>
            <div><span class="text-dimmed font-bold uppercase mr-1">By:</span> {{ selectedSubmission.submittedBy }}</div>
          </div>

          <div class="space-y-4">
            <div v-for="(val, key) in (selectedSubmission.data as Record<string, unknown>)" :key="key" class="border-b border-default pb-3">
              <div class="text-xs text-dimmed font-bold uppercase mb-1">
                {{ key }}
              </div>
              <div class="text-sm whitespace-pre-wrap">
                {{ val }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6 pt-4 border-t">
          <UButton label="Close" color="neutral" @click="showSubmissionModal = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>
