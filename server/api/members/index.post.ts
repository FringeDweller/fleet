import { userService } from '../../services/user.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { firstName, lastName, email, role, password } = await readBody(event)

  if (!firstName || !lastName || !email || !role || !password) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const hashedPassword = await userService.hashPassword(password)

  const user = await userService.createUser({
    firstName,
    lastName,
    email,
    role,
    password: hashedPassword,
    organizationId: session.user.organizationId
  })

  if (!user) {
    throw createError({ statusCode: 500, message: 'Failed to create user' })
  }

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role
  }
})
