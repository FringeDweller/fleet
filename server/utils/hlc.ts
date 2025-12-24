export interface HLCTimestamp {
  ts: number
  count: number
  node: string
}

export const createHLC = (nodeId: string) => {
  let lastTs = 0
  let count = 0

  const now = () => Date.now()

  const generate = (): string => {
    const currentTs = now()
    if (currentTs > lastTs) {
      lastTs = currentTs
      count = 0
    } else {
      count++
    }
    return `${lastTs.toString(16).padStart(12, '0')}:${count.toString(16).padStart(4, '0')}:${nodeId}`
  }

  const parse = (hlc: string): HLCTimestamp => {
    const parts = hlc.split(':')
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error(`Invalid HLC format: ${hlc}`)
    }
    const [tsStr, countStr, node] = parts
    return {
      ts: parseInt(tsStr, 16),
      count: parseInt(countStr, 16),
      node
    }
  }

  const update = (remoteHlc: string) => {
    const remote = parse(remoteHlc)
    const currentTs = now()
    lastTs = Math.max(lastTs, remote.ts, currentTs)

    if (lastTs === remote.ts && lastTs === currentTs) {
      count = Math.max(count, remote.count) + 1
    } else if (lastTs === remote.ts) {
      count = remote.count + 1
    } else if (lastTs === currentTs) {
      count = count + 1
    } else {
      count = 0
    }
    return generate()
  }

  return {
    generate,
    parse,
    update
  }
}

export const compareHLC = (a: string, b: string): number => {
  if (a === b) return 0
  return a > b ? 1 : -1
}
