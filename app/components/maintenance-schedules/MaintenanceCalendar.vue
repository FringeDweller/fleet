<script setup lang="ts">
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

const props = defineProps<{
  schedules: any[]
  workOrders: any[]
}>()

const currentDate = ref(new Date())

const days = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value))
  const end = endOfWeek(endOfMonth(currentDate.value))
  return eachDayOfInterval({ start, end })
})

const events = computed(() => {
  const list: any[] = []
  // Add Work Orders
  props.workOrders.forEach(wo => {
    if (wo.dueDate) {
      list.push({
        id: `wo-${wo.id}`,
        title: wo.woNumber,
        date: new Date(wo.dueDate),
        type: 'wo',
        status: wo.status
      })
    }
  })
  // Add Schedules Next Due
  props.schedules.forEach(s => {
    if (s.nextDueAt) {
      list.push({
        id: `sch-${s.id}`,
        title: s.name,
        date: new Date(s.nextDueAt),
        type: 'schedule',
        status: 'pending'
      })
    }
  })
  return list
})

function getEventsForDay(date: Date) {
  return events.value.filter(e => isSameDay(e.date, date))
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1)
}

function prevMonth() {
  currentDate.value = subMonths(currentDate.value, 1)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
         <UButton icon="i-lucide-chevron-left" variant="ghost" @click="prevMonth" />
         <h2 class="text-lg font-bold">{{ format(currentDate, 'MMMM yyyy') }}</h2>
         <UButton icon="i-lucide-chevron-right" variant="ghost" @click="nextMonth" />
      </div>
      <div class="flex gap-2">
         <div class="flex items-center gap-1 text-sm"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Work Order</div>
         <div class="flex items-center gap-1 text-sm"><span class="w-3 h-3 rounded-full bg-green-500"></span> Scheduled</div>
      </div>
    </div>
    
    <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1">
      <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="p-2 text-center font-semibold bg-gray-50 dark:bg-gray-800">
        {{ day }}
      </div>
      
      <div v-for="date in days" :key="date.toISOString()" 
           class="min-h-[100px] p-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
           :class="{ 'opacity-50': !isSameMonth(date, currentDate) }">
        <div class="text-right text-sm text-gray-500 mb-1">{{ format(date, 'd') }}</div>
        
        <div class="space-y-1">
           <div v-for="event in getEventsForDay(date)" :key="event.id"
                class="text-xs p-1 rounded truncate cursor-pointer"
                :class="event.type === 'wo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
           >
             {{ event.title }}
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
