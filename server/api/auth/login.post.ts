import { userService } from '../../services/user.service'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await userService.findByEmail(email)
  if (!user || !(await userService.verifyPassword(user.password, password))) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId
    }
  })

  return {
    message: 'Logged in successfully'
  }
})
