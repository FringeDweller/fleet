export const useAuth = () => {
  const { user } = useUserSession()

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isFleetManager = computed(() => user.value?.role === 'fleet_manager' || isAdmin.value)
  const isSupervisor = computed(() => user.value?.role === 'supervisor' || isFleetManager.value)
  const isTechnician = computed(() => user.value?.role === 'technician' || isSupervisor.value)
  const isOperator = computed(() => user.value?.role === 'operator' || isTechnician.value)

  const hasRole = (role: string) => {
    if (!user.value) return false
    const roles = ['operator', 'technician', 'supervisor', 'fleet_manager', 'admin']
    const userRoleIndex = roles.indexOf(user.value.role)
    const requiredRoleIndex = roles.indexOf(role)
    return userRoleIndex >= requiredRoleIndex
  }

  return {
    user,
    isAdmin,
    isFleetManager,
    isSupervisor,
    isTechnician,
    isOperator,
    hasRole
  }
}
