export default defineEventHandler((event) => {
  const method = event.method
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']

  if (safeMethods.includes(method)) return

  const origin = getRequestHeader(event, 'origin')
  const referer = getRequestHeader(event, 'referer')

  // In a real production environment, you might want to be more strict
  // and check against a known list of allowed origins from your config.
  const requestURL = getRequestURL(event)
  const expectedHost = requestURL.host

  if (origin) {
    const originHost = new URL(origin).host
    if (originHost !== expectedHost) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'CSRF validation failed: Origin mismatch.'
      })
    }
  } else if (referer) {
    const refererHost = new URL(referer).host
    if (refererHost !== expectedHost) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'CSRF validation failed: Referer mismatch.'
      })
    }
  } else {
    // If neither origin nor referer is present, it might be a suspicious request
    // or a non-browser client. For a browser-based SPA, one of these should be present.
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'CSRF validation failed: Missing Origin or Referer.'
    })
  }
})
