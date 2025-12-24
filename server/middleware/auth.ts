export default defineEventHandler(async (event) => {
  const { path } = event

  // Protect all /api routes except /api/auth/login
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/login')) {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }
  }
})
