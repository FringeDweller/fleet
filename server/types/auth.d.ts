declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    organizationId: string | null
  }

  // interface UserSession {
  //   // Add your own fields
  // }
}

export {}
