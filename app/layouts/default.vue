<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { breakpointsTailwind } from '@vueuse/core'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [
  [
    {
      label: 'Home',
      icon: 'i-lucide-house',
      to: '/',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Assets',
      icon: 'i-lucide-truck',
      to: '/assets',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Fleet Map',
      icon: 'i-lucide-map',
      to: '/assets/map',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Geofences',
      icon: 'i-lucide-square-dashed-mouse-pointer',
      to: '/assets/geofences',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Work Orders',
      icon: 'i-lucide-clipboard-list',
      to: '/work-orders',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Inventory',
      icon: 'i-lucide-package',
      to: '/inventory',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Maintenance Tasks',
      icon: 'i-lucide-wrench',
      to: '/maintenance-tasks',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Schedules',
      icon: 'i-lucide-calendar',
      to: '/maintenance-schedules',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Inbox',
      icon: 'i-lucide-inbox',
      to: '/inbox',
      badge: '4',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Customers',
      icon: 'i-lucide-users',
      to: '/customers',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Reports',
      icon: 'i-lucide-file-text',
      to: '/reports',
      defaultOpen: false,
      type: 'trigger',
      children: [
        {
          label: 'Asset Utilisation',
          to: '/reports/utilisation',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Maintenance Costs',
          to: '/reports/maintenance-costs',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Technician Performance',
          to: '/reports/technician-performance',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Compliance',
          to: '/reports/compliance',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Custom Builder',
          to: '/reports/builder',
          onSelect: () => {
            open.value = false
          }
        }
      ]
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'General',
          to: '/settings',
          exact: true,
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Members',
          to: '/settings/members',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Notifications',
          to: '/settings/notifications',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Security',
          to: '/settings/security',
          onSelect: () => {
            open.value = false
          }
        }
      ]
    }
  ],
  [
    {
      label: 'Feedback',
      icon: 'i-lucide-message-circle',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank'
    },
    {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank'
    }
  ]
] satisfies NavigationMenuItem[][]

const _groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.flat()
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
        target: '_blank'
      }
    ]
  }
])

const { isNative: _isNative } = useCapacitor()
const breakpoints = useBreakpoints(breakpointsTailwind)
const _isMobile = breakpoints.smaller('lg')

const _mobileLinks = computed(() => [
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/'
  },
  {
    label: 'Assets',
    icon: 'i-lucide-truck',
    to: '/assets'
  },
  {
    label: 'Work Orders',
    icon: 'i-lucide-clipboard-list',
    to: '/work-orders'
  },
  {
    label: 'More',
    icon: 'i-lucide-menu',
    onSelect: () => {
      open.value = true
    }
  }
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted'
        }
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost'
      }
    ]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center justify-between w-full min-w-0">
          <TeamsMenu :collapsed="collapsed" />
          <PwaSyncStatus v-if="!collapsed" />
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <UNavigationMenu
      v-if="isNative || isMobile"
      :items="mobileLinks"
      class="fixed bottom-0 left-0 right-0 lg:hidden bg-elevated/75 backdrop-blur border-t border-default px-4 pb-safe z-50"
      :ui="{ list: 'flex justify-around' }"
    />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
