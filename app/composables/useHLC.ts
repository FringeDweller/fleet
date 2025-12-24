import { createHLC as _createHLC } from '~/../server/utils/hlc'

export const useHLC = () => {
  const nodeId = useCookie('hlc-node-id', {
    default: () => crypto.randomUUID(),
    maxAge: 60 * 60 * 24 * 365 * 10 // 10 years
  })

  const hlc = _createHLC(nodeId.value)

  return {
    generate: hlc.generate,
    update: hlc.update,
    parse: hlc.parse
  }
}
