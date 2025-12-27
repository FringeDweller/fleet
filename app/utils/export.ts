export function exportToCSV(data: any[], columns: any[], fileName: string) {
  if (!data || !data.length) return

  const header = columns.map((col) => col.header || col.label || '').join(',')
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const key = col.accessorKey || col.key
        if (!key) return '""'
        const val = item[key]
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      })
      .join(',')
  })

  const csvContent = [header, ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
