<script setup lang="ts">
const toast = useToast()

const { data: _permissionsMap, refresh } = await useFetch<Record<string, string[]>>('/api/settings/roles/permissions')

const _roles = ['owner', 'manager', 'technician', 'operator']

const _availablePermissions = [
  { key: 'assets.view', label: 'View Assets' },
  { key: 'assets.manage', label: 'Manage Assets' },
  { key: 'work_orders.view', label: 'View Work Orders' },
  { key: 'work_orders.manage', label: 'Manage Work Orders' },
  { key: 'inventory.view', label: 'View Inventory' },
  { key: 'inventory.manage', label: 'Manage Inventory' },
  { key: 'reports.view', label: 'View Reports' },
  { key: 'settings.manage', label: 'Manage Settings' }
]

const _isSaving = ref(false)

async function _updatePermission(role: string, permissionKey: string, enabled: boolean) {
  const currentPermissions = _permissionsMap.value?.[role] || []
  let newPermissions: string[]
  
  if (enabled) {
    newPermissions = [...currentPermissions, permissionKey]
  } else {
    newPermissions = currentPermissions.filter(p => p !== permissionKey)
  }

  try {
    await $fetch('/api/settings/roles/permissions', {
      method: 'PUT',
      body: {
        role,
        permissions: newPermissions
      }
    })
    await refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Failed to update permissions', color: 'error' })
  }
}

function _isPermissionEnabled(role: string, permissionKey: string) {
  return _permissionsMap.value?.[role]?.includes(permissionKey) || false
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Roles & Permissions"
      description="Configure what each role can see and do in the system."
      variant="naked"
    />

    <UPageCard variant="subtle" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-default text-xs uppercase text-dimmed">
              <th class="py-3 px-4 font-semibold">Permission</th>
              <th v-for="role in _roles" :key="role" class="py-3 px-4 font-semibold text-center">
                {{ role }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="perm in _availablePermissions" :key="perm.key">
              <td class="py-4 px-4">
                <div class="font-medium text-highlighted">{{ perm.label }}</div>
                <div class="text-xs text-dimmed">{{ perm.key }}</div>
              </td>
              <td v-for="role in _roles" :key="role" class="py-4 px-4 text-center">
                <UCheckbox
                  :model-value="_isPermissionEnabled(role, perm.key)"
                  class="inline-flex"
                  :disabled="role === 'owner'"
                  @update:model-value="(val) => _updatePermission(role, perm.key, val)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UPageCard>

    <div class="text-xs text-dimmed italic px-4">
      * Owners have full access to all system features by default and their permissions cannot be modified.
    </div>
  </div>
</template>
