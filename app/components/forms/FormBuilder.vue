<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { FormField } from '../../../types/form-builder'

const props = defineProps<{
  modelValue: FormField[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FormField[]): void
}>()

const fields = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const selectedFieldId = ref<string | null>(null)
const selectedField = computed(() => fields.value.find(f => f.id === selectedFieldId.value))

const toolset = [
  { type: 'text', label: 'Text Input', icon: 'i-lucide-type' },
  { type: 'textarea', label: 'Text Area', icon: 'i-lucide-align-justify' },
  { type: 'number', label: 'Number', icon: 'i-lucide-hash' },
  { type: 'date', label: 'Date Picker', icon: 'i-lucide-calendar' },
  { type: 'time', label: 'Time Picker', icon: 'i-lucide-clock' },
  { type: 'checkbox', label: 'Checkbox', icon: 'i-lucide-check-square' },
  { type: 'select', label: 'Dropdown', icon: 'i-lucide-list' },
  { type: 'section', label: 'Section Header', icon: 'i-lucide-heading' },
  { type: 'photo', label: 'Photo Upload', icon: 'i-lucide-camera' },
  { type: 'signature', label: 'Signature', icon: 'i-lucide-pen-tool' }
]

function onClone(element: Record<string, any>) {
  return {
    id: crypto.randomUUID(),
    type: element.type,
    label: element.label || 'New Field',
    key: `field_${Date.now().toString(36)}`,
    required: false,
    placeholder: '',
    options: []
  }
}

function removeField(id: string) {
  fields.value = fields.value.filter(f => f.id !== id)
  if (selectedFieldId.value === id) {
    selectedFieldId.value = null
  }
}

function addOption(field: FormField) {
  if (!field.options) field.options = []
  field.options.push({ label: `Option ${field.options.length + 1}`, value: `opt_${Date.now()}` })
}

function removeOption(field: FormField, index: number) {
  if (field.options) {
    field.options.splice(index, 1)
  }
}

function enableLogic(field: FormField) {
  field.logic = {
    action: 'show',
    match: 'all',
    conditions: [{ field: '', operator: 'eq', value: '' }]
  }
}

function addCondition(field: FormField) {
  if (field.logic) {
    field.logic.conditions.push({ field: '', operator: 'eq', value: '' })
  }
}

function removeCondition(field: FormField, index: number) {
  if (field.logic) {
    field.logic.conditions.splice(index, 1)
  }
}

function otherFields(currentField: FormField) {
  return fields.value
    .filter(f => f.id !== currentField.id && f.type !== 'section')
    .map(f => ({ label: f.label, value: f.key }))
}
</script>

<template>
  <div class="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
    <!-- Sidebar: Tools -->
    <div class="w-64 border-r bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div class="p-4 font-bold text-sm text-dimmed uppercase tracking-wider border-b">
        Fields
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <VueDraggable
          v-model="toolset"
          :group="{ name: 'fields', pull: 'clone', put: false }"
          :sort="false"
          :clone="onClone"
          class="space-y-2"
        >
          <div
            v-for="tool in toolset"
            :key="tool.type"
            class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border rounded cursor-move hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm"
          >
            <UIcon :name="tool.icon" class="w-5 h-5" />
            <span class="text-sm font-medium">{{ tool.label }}</span>
          </div>
        </VueDraggable>
      </div>
    </div>

    <!-- Canvas -->
    <div class="flex-1 flex flex-col bg-gray-100 dark:bg-gray-950/50">
      <div class="p-4 border-b bg-white dark:bg-gray-900 flex justify-between items-center">
        <div class="text-sm font-medium">
          Form Canvas
        </div>
        <div class="text-xs text-dimmed">
          Drag fields from the left sidebar
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <VueDraggable
          v-model="fields"
          group="fields"
          class="min-h-[400px] space-y-4 max-w-2xl mx-auto pb-20"
          item-key="id"
        >
          <div
            v-for="element in fields"
            :key="element.id"
            :class="[
              'group relative p-4 rounded-lg border-2 transition-all cursor-pointer bg-white dark:bg-gray-900',
              selectedFieldId === element.id
                ? 'border-primary-500 ring-4 ring-primary-500/10'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
            ]"
            @click="selectedFieldId = element.id"
          >
            <!-- Field Render Preview -->
            <div class="pointer-events-none">
              <div v-if="element.logic" class="absolute top-2 left-2">
                <UBadge
                  size="xs"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-git-branch"
                  title="Conditional Logic"
                />
              </div>
              <div v-if="element.type === 'section'" class="border-b pb-2 mb-2">
                <h3 class="text-lg font-bold">
                  {{ element.label }}
                </h3>
              </div>

              <UFormGroup
                v-else
                :label="element.label"
                :required="element.required"
                :help="element.helpText"
              >
                <UInput v-if="['text', 'number', 'date', 'time'].includes(element.type)" :placeholder="element.placeholder" disabled />
                <UTextarea v-else-if="element.type === 'textarea'" :placeholder="element.placeholder" disabled />
                <USelect v-else-if="element.type === 'select'" :options="['Option 1', 'Option 2']" disabled />
                <UCheckbox v-else-if="element.type === 'checkbox'" label="Check this option" disabled />
                <div v-else-if="element.type === 'photo'" class="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-dashed flex items-center justify-center text-dimmed">
                  <UIcon name="i-lucide-camera" class="w-6 h-6 mr-2" /> Photo Upload
                </div>
                <div v-else-if="element.type === 'signature'" class="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-dashed flex items-center justify-center text-dimmed">
                  <UIcon name="i-lucide-pen-tool" class="w-6 h-6 mr-2" /> Signature Pad
                </div>
              </UFormGroup>
            </div>

            <!-- Remove Action -->
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
              size="xs"
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="removeField(element.id)"
            />
          </div>

          <div v-if="fields.length === 0" class="text-center py-12 text-dimmed border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            Drop fields here
          </div>
        </VueDraggable>
      </div>
    </div>

    <!-- Properties Panel -->
    <div class="w-80 border-l bg-white dark:bg-gray-900 overflow-y-auto">
      <div v-if="selectedField" class="p-4 space-y-6">
        <div class="border-b pb-4">
          <h3 class="font-bold text-lg">
            Properties
          </h3>
          <p class="text-xs text-dimmed">
            {{ selectedField.type }} field
          </p>
        </div>

        <UFormGroup label="Label" required>
          <UInput v-model="selectedField.label" />
        </UFormGroup>

        <UFormGroup label="Field Key" help="Unique identifier for data storage">
          <UInput v-model="selectedField.key" />
        </UFormGroup>

        <UFormGroup v-if="['text', 'number', 'textarea'].includes(selectedField.type)" label="Placeholder">
          <UInput v-model="selectedField.placeholder" />
        </UFormGroup>

        <UFormGroup label="Help Text">
          <UInput v-model="selectedField.helpText" />
        </UFormGroup>

        <div class="space-y-4 pt-4 border-t">
          <UCheckbox v-model="selectedField.required" label="Required Field" />
        </div>

        <!-- Options for Select/Radio -->
        <div v-if="['select', 'radio'].includes(selectedField.type)" class="pt-4 border-t space-y-3">
          <div class="flex justify-between items-center">
            <h4 class="font-medium text-sm">
              Options
            </h4>
            <UButton
              size="xs"
              icon="i-lucide-plus"
              label="Add"
              variant="soft"
              @click="addOption(selectedField!)"
            />
          </div>

          <div v-if="!selectedField.options || selectedField.options.length === 0" class="text-xs text-dimmed italic">
            No options added
          </div>

          <div v-else class="space-y-2">
            <div v-for="(opt, idx) in selectedField.options" :key="idx" class="flex items-center gap-2">
              <UInput v-model="opt.label" size="xs" class="flex-1" />
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="removeOption(selectedField!, idx)"
              />
            </div>
          </div>
        </div>

        <!-- Conditional Logic -->
        <div class="pt-4 border-t space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="font-medium text-sm">
              Conditional Logic
            </h4>
            <UButton
              v-if="!selectedField.logic"
              size="xs"
              label="Enable"
              variant="soft"
              @click="enableLogic(selectedField!)"
            />
            <UButton
              v-else
              size="xs"
              label="Disable"
              color="error"
              variant="ghost"
              @click="selectedField.logic = undefined"
            />
          </div>

          <div v-if="selectedField.logic" class="space-y-4">
            <div class="flex items-center gap-2 text-xs">
              <USelect
                v-model="selectedField.logic.action"
                size="xs"
                :options="[{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }]"
              />
              <span>if</span>
              <USelect
                v-model="selectedField.logic.match"
                size="xs"
                :options="[{ label: 'All', value: 'all' }, { label: 'Any', value: 'any' }]"
              />
              <span>match:</span>
            </div>

            <div v-for="(cond, idx) in selectedField.logic.conditions" :key="idx" class="p-2 border rounded bg-gray-50 dark:bg-gray-800 space-y-2 relative group/cond">
              <USelect
                v-model="cond.field"
                size="xs"
                placeholder="Select Field"
                :options="otherFields(selectedField!)"
              />
              <USelect
                v-model="cond.operator"
                size="xs"
                :options="[
                  { label: 'Equals', value: 'eq' },
                  { label: 'Not Equals', value: 'neq' },
                  { label: 'Contains', value: 'contains' },
                  { label: 'Greater Than', value: 'gt' },
                  { label: 'Less Than', value: 'lt' }
                ]"
              />
              <UInput v-model="cond.value" size="xs" placeholder="Value" />

              <UButton
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="xs"
                class="absolute -top-2 -right-2 opacity-0 group-hover/cond:opacity-100 transition-opacity"
                @click="removeCondition(selectedField!, idx)"
              />
            </div>

            <UButton
              block
              size="xs"
              icon="i-lucide-plus"
              label="Add Condition"
              variant="soft"
              @click="addCondition(selectedField!)"
            />
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center text-dimmed">
        <UIcon name="i-lucide-settings-2" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Select a field to edit its properties</p>
      </div>
    </div>
  </div>
</template>
