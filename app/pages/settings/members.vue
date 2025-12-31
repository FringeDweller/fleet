<script setup lang="ts">
const toast = useToast()

const { data: members, refresh } = await useFetch<any[]>('/api/members', { default: () => [] })

const q = ref('')

const filteredMembers = computed(() => {
  return members.value.filter((member) => {
    return (
      member.name.toLowerCase().includes(q.value.toLowerCase()) ||
      member.email.toLowerCase().includes(q.value.toLowerCase())
    )
  })
})

const isModalOpen = ref(false)
const isSaving = ref(false)
const selectedMember = ref<any>(null)

const defaultState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'operator',
  password: 'Password123!' // Default password for new users
}

const state = ref({ ...defaultState })

function openAddModal() {
  selectedMember.value = null
  state.value = { ...defaultState }
  isModalOpen.value = true
}

function openEditModal(member: any) {
  selectedMember.value = member
  const [firstName, ...lastNameParts] = member.name.split(' ')
  state.value = {
    firstName,
    lastName: lastNameParts.join(' '),
    email: member.email,
    role: member.role,
    password: '' // Don't show password on edit
  }
  isModalOpen.value = true
}

async function saveMember() {
  isSaving.value = true
  try {
    if (selectedMember.value) {
      await $fetch(`/api/members/${selectedMember.value.id}`, {
        method: 'PUT',
        body: state.value
      })
    } else {
      await $fetch('/api/members', {
        method: 'POST',
        body: state.value
      })
    }
    toast.add({ title: 'Member saved', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to save member', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function deleteMember(id: string) {
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

const columns = [
  { accessorKey: 'name', header: 'Member' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'actions', header: '' }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">Members</h2>
        <p class="text-gray-500">Manage your team members and their roles.</p>
      </div>
      <UButton
        label="Add Member"
        icon="i-lucide-plus"
        @click="openAddModal"
      />
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Search members..."
          class="w-full"
        />
      </template>

      <UTable
        :data="filteredMembers"
        :columns="columns"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar v-bind="row.original.avatar" size="sm" />
            <div>
              <div class="font-medium text-highlighted">{{ row.original.name }}</div>
              <div class="text-xs text-dimmed">{{ row.original.email }}</div>
            </div>
          </div>
        </template>

        <template #role-cell="{ row }">
          <UBadge variant="subtle" class="capitalize">
            {{ row.original.role }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="xs"
              @click="deleteMember(row.original.id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isModalOpen" title="Member Details">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveMember">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="First Name" required>
              <UInput v-model="state.firstName" />
            </UFormField>
            <UFormField label="Last Name" required>
              <UInput v-model="state.lastName" />
            </UFormField>
          </div>

          <UFormField label="Email" required>
            <UInput v-model="state.email" type="email" :disabled="!!selectedMember" />
          </UFormField>

          <UFormField label="Role" required>
            <USelect
              v-model="state.role"
              :items="['owner', 'manager', 'technician', 'operator']"
            />
          </UFormField>

          <UFormField v-if="!selectedMember" label="Initial Password" required>
            <UInput v-model="state.password" type="password" />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              @click="isModalOpen = false"
            />
            <UButton
              type="submit"
              label="Save Member"
              :loading="isSaving"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>