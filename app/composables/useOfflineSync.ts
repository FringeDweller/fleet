import { openDB, type IDBPDatabase } from 'idb'

export interface SyncOperation {
  id: string
  hlc: string
  collection: string
  action: 'create' | 'update' | 'delete'
  data: any
  synced: boolean
}

let dbPromise: Promise<IDBPDatabase> | null = null

export const useOfflineSync = () => {
  const initDB = () => {
    if (dbPromise) return dbPromise

    dbPromise = openDB('fleet-offline', 1, {
      upgrade(db) {
        // Data stores
        db.createObjectStore('assets', { keyPath: 'id' })
        db.createObjectStore('work-orders', { keyPath: 'id' })
        db.createObjectStore('inventory', { keyPath: 'id' })
        db.createObjectStore('maintenance-tasks', { keyPath: 'id' })
        db.createObjectStore('operator-sessions', { keyPath: 'id' })
        db.createObjectStore('inspections', { keyPath: 'id' })

        // Sync queue
        db.createObjectStore('sync-queue', { keyPath: 'id' })
      }
    })

    return dbPromise
  }

  const getCollection = async (collection: string) => {
    const db = await initDB()
    return db.getAll(collection)
  }

  const getItem = async (collection: string, id: string) => {
    const db = await initDB()
    return db.get(collection, id)
  }

  const putItem = async (collection: string, item: any) => {
    const db = await initDB()
    return db.put(collection, item)
  }

  const deleteItem = async (collection: string, id: string) => {
    const db = await initDB()
    return db.delete(collection, id)
  }

  const { generate: generateHLC } = useHLC()

  const queueOperation = async (collection: string, action: 'create' | 'update' | 'delete', data: any) => {
    const db = await initDB()
    const id = crypto.randomUUID()
    const hlc = generateHLC()

    const operation: SyncOperation = {
      id,
      hlc,
      collection,
      action,
      data,
      synced: false
    }

    await db.put('sync-queue', operation)

    // Optimistically update local store
    if (action === 'delete') {
      await db.delete(collection, data.id)
    } else {
      await db.put(collection, data)
    }

    return operation
  }

  const getQueue = async () => {
    const db = await initDB()
    return db.getAll('sync-queue')
  }

  const clearQueueItem = async (id: string) => {
    const db = await initDB()
    return db.delete('sync-queue', id)
  }

  const online = useOnline()
  const syncing = ref(false)

  const sync = async () => {
    if (!online.value || syncing.value) return

    const queue = await getQueue()
    if (queue.length === 0) return

    syncing.value = true
    try {
      const { results } = await $fetch('/api/sync', {
        method: 'POST',
        body: { operations: queue }
      })

      for (const res of results) {
        if (res.success) {
          await clearQueueItem(res.id)
        }
      }
    } catch (error) {
      console.error('Background sync failed', error)
    } finally {
      syncing.value = false
    }
  }

  // Watch for online status to trigger sync
  watch(online, (isOnline) => {
    if (isOnline) {
      sync()
    }
  })

  return {
    getCollection,
    getItem,
    putItem,
    deleteItem,
    initDB,
    queueOperation,
    getQueue,
    clearQueueItem,
    sync,
    syncing
  }
}
