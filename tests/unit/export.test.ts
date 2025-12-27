import { describe, expect, it, vi } from 'vitest'
import { exportToCSV } from '../../app/utils/export'

describe('exportToCSV', () => {
  it('should handle empty data gracefully', () => {
    const spy = vi.spyOn(document, 'createElement')
    exportToCSV([], [], 'test')
    expect(spy).not.toHaveBeenCalled()
  })

  it('should create a download link with correct CSV content', () => {
    // Mock URL.createObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test-url')
    global.URL.createObjectURL = createObjectURLMock

    // Mock Blob
    let blobContent: string = ''
    class MockBlob {
      content: any
      options: any
      constructor(content: any[], options: any) {
        this.content = content
        this.options = options
        blobContent = content[0]
      }
    }
    vi.stubGlobal('Blob', MockBlob)

    // Mock document.createElement and body.appendChild
    const linkMock = {
      setAttribute: vi.fn(),
      style: { visibility: '' },
      click: vi.fn()
    } as any
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    const data = [
      { id: '1', name: 'Asset 1', cost: 100 },
      { id: '2', name: 'Asset 2', cost: 200 }
    ]
    const columns = [
      { accessorKey: 'id', header: 'ID' },
      { key: 'name', label: 'Name' },
      { accessorKey: 'cost', header: 'Cost' }
    ]

    exportToCSV(data, columns, 'assets-report')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(linkMock.setAttribute).toHaveBeenCalledWith('download', 'assets-report.csv')
    expect(linkMock.setAttribute).toHaveBeenCalledWith('href', 'blob:test-url')
    expect(linkMock.click).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    expect(blobContent).toContain('ID,Name,Cost')
    expect(blobContent).toContain('"1","Asset 1","100"')
    expect(blobContent).toContain('"2","Asset 2","200"')
  })
})
