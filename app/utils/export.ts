export function exportToCSV(data: any[], columns: { key: string; label: string }[], fileName: string) {
  if (!data || !data.length) return

  const header = columns.map(col => col.label).join(',')
  const rows = data.map(item => {
    return columns.map(col => {
      const val = item[col.key]
      return `"${String(val).replace(/