<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import * as z from 'zod'

const passwordSchema = z.object({
  current: z.string().min(8, 'Must be at least 8 characters'),
  new: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'Passwords must be different' })
  }
  return errors
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-xl font-bold">Password</h2>
        <p class="text-sm text-gray-500">Confirm your current password before setting a new one.</p>
      </template>
      <UForm
        :schema="passwordSchema"
        :state="password"
        :validate="validate"
        class="flex flex-col gap-4 max-w-xs"
      >
        <UFormField name="current">
          <UInput
            v-model="password.current"
            type="password"
            placeholder="Current password"
            class="w-full"
          />
        </UFormField>

        <UFormField name="new">
          <UInput
            v-model="password.new"
            type="password"
            placeholder="New password"
            class="w-full"
          />
        </UFormField>

        <UButton label="Update" class="w-fit" type="submit" />
      </UForm>
    </UCard>

    <UCard class="bg-gradient-to-tl from-error/10 from-5% to-default">
      <template #header>
        <h2 class="text-xl font-bold">Account</h2>
        <p class="text-sm text-gray-500">No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently.</p>
      </template>
      <div class="flex justify-end pt-4 border-t border-default">
        <UButton label="Delete account" color="error" />
      </div>
    </UCard>
  </div>
</template>