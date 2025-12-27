import type { Inspection } from '~/types'

export const usePreStartInspection = () => {
  const currentInspection = ref<Inspection | null>(null)
  const loading = ref(false)

  const { queueOperation, putItem } = useOfflineSync()
  const online = useOnline()
  const { user } = useUserSession()

  const { activeSession } = useOperatorSession()

  const startInspection = async (
    assetId: string,
    location?: { latitude: number; longitude: number }
  ) => {
    const inspection: Inspection = {
      id: crypto.randomUUID(),
      assetId,
      operatorId: user.value?.id as string,
      sessionId: activeSession.value?.assetId === assetId ? activeSession.value.id : null,
      startTime: new Date().toISOString(),
      location,
      status: 'pending',
      results: [],
      checkpoints: [],
      data: {},
      notes: null,
      organizationId: (user.value as any)?.organizationId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    currentInspection.value = inspection
    return inspection
  }

  const recordCheckpoint = async (
    checkpointId: string,
    location?: { latitude: number; longitude: number }
  ) => {
    if (!currentInspection.value) return
    if (!currentInspection.value.checkpoints) {
      currentInspection.value.checkpoints = []
    }
    currentInspection.value.checkpoints.push({
      id: checkpointId,
      timestamp: new Date().toISOString(),
      location
    })
  }

  const submitInspection = async (
    status: 'passed' | 'failed',
    results: unknown[],
    signatureUrl?: string
  ) => {
    if (!currentInspection.value) return

    loading.value = true
    try {
      const finalInspection = {
        ...currentInspection.value,
        status,
        results,
        signatureUrl,
        endTime: new Date().toISOString()
      }

      if (online.value) {
        await $fetch('/api/inspections', {
          method: 'POST',
          body: finalInspection
        })
      } else {
        await queueOperation('inspections', 'create', finalInspection)
      }

      await putItem('inspections', finalInspection)
      currentInspection.value = null
      return finalInspection
    } finally {
      loading.value = false
    }
  }

  return {
    currentInspection,
    loading,
    startInspection,
    recordCheckpoint,
    submitInspection
  }
}
