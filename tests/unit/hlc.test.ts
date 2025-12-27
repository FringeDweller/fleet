import { beforeEach, describe, expect, it, vi } from 'vitest'
import { compareHLC, createHLC } from '../../server/utils/hlc'

describe('Hybrid Logical Clock (HLC)', () => {
  const nodeId = 'test-node'
  let hlc: ReturnType<typeof createHLC>

  beforeEach(() => {
    hlc = createHLC(nodeId)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  it('generates an initial timestamp', () => {
    const ts = hlc.generate()
    const parsed = hlc.parse(ts)
    expect(parsed.ts).toBe(new Date('2025-01-01T00:00:00Z').getTime())
    expect(parsed.count).toBe(0)
    expect(parsed.node).toBe(nodeId)
  })

  it('increments the count when generating in the same millisecond', () => {
    const ts1 = hlc.generate()
    const ts2 = hlc.generate()

    const parsed1 = hlc.parse(ts1)
    const parsed2 = hlc.parse(ts2)

    expect(parsed1.ts).toBe(parsed2.ts)
    expect(parsed1.count).toBe(0)
    expect(parsed2.count).toBe(1)
  })

  it('resets the count when physical time advances', () => {
    hlc.generate()
    vi.advanceTimersByTime(1)
    const ts2 = hlc.generate()

    const parsed2 = hlc.parse(ts2)
    expect(parsed2.count).toBe(0)
  })

  it('updates from a remote timestamp in the past', () => {
    const remoteTs = createHLC('remote').generate()
    vi.advanceTimersByTime(100)

    const updated = hlc.update(remoteTs)
    const parsed = hlc.parse(updated)

    expect(parsed.ts).toBe(Date.now())
    expect(parsed.count).toBe(0)
  })

  it('updates from a remote timestamp in the future', () => {
    const futureHlc = createHLC('remote')
    vi.advanceTimersByTime(1000)
    const remoteTs = futureHlc.generate()

    vi.setSystemTime(new Date('2025-01-01T00:00:00Z')) // Back to "now"

    const updated = hlc.update(remoteTs)
    const parsed = hlc.parse(updated)

    expect(parsed.ts).toBe(hlc.parse(remoteTs).ts)
    expect(parsed.count).toBe(hlc.parse(remoteTs).count + 1)
  })

  it('compares two HLC timestamps correctly', () => {
    const ts1 = '000001941ea0:0000:node1'
    const ts2 = '000001941ea0:0001:node1'
    const ts3 = '000001941eb0:0000:node1'

    expect(compareHLC(ts1, ts2)).toBe(-1)
    expect(compareHLC(ts2, ts1)).toBe(1)
    expect(compareHLC(ts1, ts1)).toBe(0)
    expect(compareHLC(ts3, ts1)).toBe(1)
  })
})
