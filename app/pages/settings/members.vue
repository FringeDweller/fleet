<script setup lang="ts">
const toast = useToast()

const { data: members, refresh } = await useFetch<any[]>('/api/members', { default: () => [] })

const q = ref('')

const _filteredMembers = computed(() => {
  return members.value.filter((member) => {
    return (
      member.name.toLowerCase().includes(q.value.toLowerCase()) ||
      member.email.toLowerCase().includes(q.value.toLowerCase())
    )
  })
})

const _isModalOpen = ref(false)
const _isSaving = ref(false)
const _selectedMember = ref<any>(null)

const _defaultState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'operator',
  password: 'Password123!' // Default password for new users
}

const _state = ref({ ..._defaultState })

function _openAddModal() {
  _selectedMember.value = null
  _state.value = { ..._defaultState }
  _isModalOpen.value = true
}

function _openEditModal(member: any) {
  _selectedMember.value = member
  const [firstName, ...lastNameParts] = member.name.split(' ')
  _state.value = {
    firstName,
    lastName: lastNameParts.join(' '),
    email: member.email,
    role: member.role,
    password: '' // Don't show password on edit
  }
  _isModalOpen.value = true
}

async function _saveMember() {
  _isSaving.value = true
  try {
    if (_selectedMember.value) {
      await $fetch(`/api/members/${_selectedMember.value.id}`, {
        method: 'PUT',
        body: _state.value
      })
    } else {
      await $fetch('/api/members', {
        method: 'POST',
        body: _state.value
      })
    }
    toast.add({ title: 'Member saved', color: 'success' })
    _isModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save member', color: 'error' })
  } finally {
    _isSaving.value = false
  }
}

async function _deleteMember(id: string) {
  if (!confirm('Are you sure you want to remove this member?')) return
  
  try {
    await $fetch(`/api/members/${id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Member removed', color: 'success' })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to remove member', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Members"
      description="Manage your team members and their roles."
      variant="naked"
    >
      <template #right>
        <UButton
          label="Invite Member"
          icon="i-lucide-plus"
          @click="_openAddModal"
        />
      </template>
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ body: 'p-0' }">
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Search members..."
          class="w-full"
        />
      </template>

      <UTable
        :rows="_filteredMembers"
        :columns="[
          { key: 'member', label: 'Member' },
          { key: 'role', label: 'Role' },
          { key: 'actions', label: '' }
        ]"
      >
        <template #member-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar v-bind="row.avatar" size="sm" />
            <div>
              <div class="font-medium text-highlighted">{{ row.name }}</div>
              <div class="text-xs text-dimmed">{{ row.email }}</div>
            </div>
          </div>
        </template>

        <template #role-data="{ row }">
          <UBadge variant="subtle" class="capitalize">
            {{ row.role }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="_openEditModal(row)"
            />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="xs"
              @click="_deleteMember(row.id)"
            />
          </div>
        </template>
      </UTable>
    </UPageCard>

    <UModal v-model:open="_isModalOpen" title="Member Details">
      <template #body>
        <UForm :state="_state" class="space-y-4" @submit="_saveMember">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="First Name" required>
              <UInput v-model="_state.firstName" />
            </UFormField>
            <UFormField label="Last Name" required>
              <UInput v-model="_state.lastName" />
            </UFormField>
          </div>

          <UFormField label="Email" required>
            <UInput v-model="_state.email" type="email" :disabled="!!_selectedMember" />
          </UFormField>

          <UFormField label="Role" required>
            <USelect
              v-model="_state.role"
              :options="['owner', 'manager', 'technician', 'operator']"
            />
          </UFormField>

          <UFormField v-if="!_selectedMember" label="Initial Password" required>
            <UInput v-model="_state.password" type="password" />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              @click="_isModalOpen = false"
            />
            <UButton
              type="submit"
              label="Save Member"
              :loading="_isSaving"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
