<script setup lang="ts">
const { $pwa } = useNuxtApp()

const showInstallPrompt = ref(false)

onMounted(() => {
  if ($pwa?.showInstallPrompt) {
    showInstallPrompt.value = true
  }
})

const _install = async () => {
  if ($pwa?.install) {
    await $pwa.install()
    showInstallPrompt.value = false
  }
}
</script>

<template>
  <UAlert
    v-if="showInstallPrompt"
    title="Install Fleet"
    description="Install our app for a better experience and offline access."
    icon="i-lucide-download"
    class="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:right-4 lg:left-auto lg:w-96 z-50"
    :actions="[
      { label: 'Install', color: 'primary', onClick: install },
      { label: 'Later', color: 'neutral', variant: 'outline', onClick: () => { showInstallPrompt = false } }
    ]"
  />
</template>
