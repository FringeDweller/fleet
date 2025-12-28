export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(
        JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta })
      )
    } else {
      console.log(`[INFO] ${message}`, meta || '')
    }
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        JSON.stringify({
          level: 'error',
          message,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          ...meta
        })
      )
    } else {
      console.error(`[ERROR] ${message}`, error, meta || '')
    }
  },
  warn: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta })
      )
    } else {
      console.warn(`[WARN] ${message}`, meta || '')
    }
  }
}
