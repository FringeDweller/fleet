import { userService } from './server/services/user.service'

async function check() {
  const email = 'wrong@fleet.com'
  const user = await userService.findByEmail(email)
  if (!user) {
    console.log('User not found as expected')
  }
}

check()