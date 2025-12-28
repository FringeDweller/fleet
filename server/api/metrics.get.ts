export default defineEventHandler(async (event) => {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()

  // Prometheus format
  const metrics = [
    '# HELP process_uptime_seconds The uptime of the process in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime}`,
    '',
    '# HELP process_heap_used_bytes The amount of heap used in bytes',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${memoryUsage.heapUsed}`,
    '',
    '# HELP process_heap_total_bytes The total amount of heap in bytes',
    '# TYPE process_heap_total_bytes gauge',
    `process_heap_total_bytes ${memoryUsage.heapTotal}`,
    '',
    '# HELP process_rss_bytes The resident set size in bytes',
    '# TYPE process_rss_bytes gauge',
    `process_rss_bytes ${memoryUsage.rss}`,
    ''
  ].join('\n')

  setResponseHeader(event, 'Content-Type', 'text/plain')
  return metrics
})
