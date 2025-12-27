<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { fetch: fetchSession } = useUserSession()
const email = ref('')
const password = ref('')
const loading = ref(false)

const toast = useToast()

async function _onLogin() {
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })
    await fetchSession()
    await navigateTo('/')
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to login',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex flex-col items-center gap-2">
          <h1 class="text-2xl font-bold">
            Fleet
          </h1>
          <p class="text-sm text-gray-500">
            Log in to your account
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onLogin">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@fleet.com"
            autocomplete="email"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          :loading="loading"
        >
          Sign In
        </UButton>
      </form>
    </UCard>
  </div>
</template>
