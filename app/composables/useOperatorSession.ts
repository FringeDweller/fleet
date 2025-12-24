export const useOperatorSession = () => {
  const activeSession = ref<any>(null)
  const loading = ref(false)

  const { queueOperation, getItem, putItem } = useOfflineSync()
  const online = useOnline()
  const { user } = useUserSession()
  const { startTracking, stopTracking } = useGps()

  const fetchActiveSession = async () => {
    if (!user.value) return
    
    loading.value = true
    try {
      if (online.value) {
        activeSession.value = await $fetch('/api/operators/sessions/active')
        if (activeSession.value) {
          await putItem('operator-sessions', activeSession.value)
          startTracking() // Start tracking if session found
        }
      } else {
        // Find active session in IndexedDB
        const sessions = await getItem('operator-sessions', 'active')
        activeSession.value = sessions
        if (activeSession.value) startTracking()
      }
    } catch (error) {
      console.error('Failed to fetch active session', error)
    } finally {
      loading.value = false
    }
  }

  const logOn = async (assetId: string, data: { startOdometer?: string, startHours?: string, previousSessionId?: string } = {}) => {
    loading.value = true
    try {
      if (online.value) {
        const session = await $fetch('/api/operators/sessions', {
          method: 'POST',
          body: { assetId, ...data }
        })
        activeSession.value = session
        await putItem('operator-sessions', session)
        startTracking()
        return session
      } else {
        const session = {
          id: crypto.randomUUID(),
          assetId,
          operatorId: user.value?.id,
          startTime: new Date().toISOString(),
          ...data
        }
        await queueOperation('operator-sessions', 'create', session)
        activeSession.value = session
        startTracking()
        return session
      }
    } finally {
      loading.value = false
    }
  }

  const logOff = async (data: { endOdometer?: string, endHours?: string } = {}) => {
    if (!activeSession.value) return

    loading.value = true
    try {
      if (online.value) {
        await $fetch(`/api/operators/sessions/${activeSession.value.id}`, {
          method: 'PUT',
          body: data
        })
      } else {
        await queueOperation('operator-sessions', 'update', {
          ...activeSession.value,
          ...data,
          endTime: new Date().toISOString()
        })
      }
      activeSession.value = null
      stopTracking()
      // Clear active session from IDB or mark it closed
    } finally {
      loading.value = false
    }
  }

  return {
    activeSession,
    loading,
    fetchActiveSession,
    logOn,
    logOff
  }
}
