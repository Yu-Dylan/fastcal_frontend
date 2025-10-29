<template>
  <div class="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-white">Your Calendar</h2>
      <button 
        @click="refresh"
        :disabled="loading"
        class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-600 border border-gray-600"
      >
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-400">Loading drafts...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-400 mb-2">{{ error }}</p>
      <p class="text-sm text-gray-500">Make sure your backend server is running on port 8000</p>
    </div>

    <div v-else-if="drafts.length === 0 && googleEvents.length === 0" class="text-center py-8">
      <p class="text-gray-400">No events yet. Start chatting to create your first event!</p>
    </div>

    <div v-else class="space-y-2">
      <!-- Compact Calendar View -->
      <div v-for="event in allEvents" :key="event.id" class="group">
        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-750 transition-colors">
          <!-- Time -->
          <div class="flex-shrink-0 w-16 text-right">
            <div class="text-xs text-gray-500">{{ getEventDate(event) }}</div>
            <div class="text-sm font-semibold text-gray-300">{{ getEventTime(event) }}</div>
          </div>
          
          <!-- Event Bar -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <div :class="event.source === 'google' ? 'w-1 h-8 bg-blue-500 rounded' : 'w-1 h-8 bg-green-500 rounded'"></div>
              <div class="flex-1 min-w-0">
                <a 
                  v-if="event.source === 'google'"
                  :href="getGoogleCalendarLink(event)"
                  target="_blank"
                  class="text-sm font-medium text-blue-400 hover:text-blue-300 truncate block"
                >
                  {{ event.title }}
                </a>
                <div v-else class="text-sm font-medium text-white truncate">{{ event.title }}</div>
                <div class="text-xs text-gray-400 truncate">{{ event.location || 'No location' }}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <button
            @click="handleDelete(event.id, event.source)"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDraftsStore } from '../stores/drafts'

const draftsStore = useDraftsStore()

const drafts = computed(() => draftsStore.drafts)
const loading = computed(() => draftsStore.loading)
const error = computed(() => draftsStore.error)
const googleEvents = ref<any[]>([])
const filteredEventIds = ref<string[] | null>(null)

// Merge and sort all events
const allEvents = computed(() => {
  const google = googleEvents.value.map(e => ({
    id: e.id,
    title: e.summary,
    startTime: e.start?.dateTime || e.start?.date,
    endTime: e.end?.dateTime || e.end?.date,
    location: e.location,
    htmlLink: e.htmlLink, // Include the Google Calendar link
    source: 'google'
  }))
  
  // Don't show local drafts - Google Calendar is the source of truth
  // const local = drafts.value.map(d => ({
  //   id: d._id,
  //   title: d.title,
  //   startTime: d.startTime,
  //   endTime: d.endTime,
  //   location: d.location,
  //   source: 'draft'
  // }))
  
  const allEventsUnsorted = [...google] // Only show Google Calendar events
  const sorted = allEventsUnsorted.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  // Apply filter if active
  if (filteredEventIds.value) {
    return sorted.filter(e => filteredEventIds.value!.includes(e.id))
  }
  
  return sorted
})

onMounted(async () => {
  draftsStore.fetchUserDrafts()
  await fetchGoogleEvents()
  
  // Listen for filter events from chat
  window.addEventListener('filterCalendar', ((e: CustomEvent) => {
    filteredEventIds.value = e.detail
  }) as EventListener)
  
  // Listen for refresh events (e.g., after deletion)
  window.addEventListener('refreshCalendar', () => {
    fetchGoogleEvents()
    filteredEventIds.value = null
  })
})

const fetchGoogleEvents = async () => {
  try {
    console.log('Fetching Google Calendar events...')
    const response = await fetch('http://localhost:8000/api/CalendarSync/getGoogleEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'user123' })
    })
    const data = await response.json()
    console.log('Google Calendar API response:', data)
    if (data.events) {
      googleEvents.value = data.events
      console.log('Loaded', data.events.length, 'Google Calendar events')
    } else if (data.error) {
      console.error('Google Calendar API error:', data.error)
    } else {
      console.warn('No events returned from Google Calendar')
    }
  } catch (e) {
    console.error('Failed to fetch Google events:', e)
  }
}

const refresh = async () => {
  draftsStore.fetchUserDrafts()
  await fetchGoogleEvents()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatGoogleDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getEventDate = (event: any) => {
  const date = new Date(event.startTime)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getEventTime = (event: any) => {
  const date = new Date(event.startTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const getGoogleCalendarLink = (event: any) => {
  // Google Calendar event URL format with proper encoding
  // Use the htmlLink if available, otherwise construct the URL
  if (event.htmlLink) {
    return event.htmlLink
  }
  // Fallback: construct URL with event ID
  return `https://calendar.google.com/calendar/event?eid=${btoa(event.id)}`
}

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'Created':
      return 'bg-blue-100 text-blue-800'
    case 'Proposed':
      return 'bg-yellow-100 text-yellow-800'
    case 'Validated':
      return 'bg-green-100 text-green-800'
    case 'Conflicted':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const handleValidate = async (id: string) => {
  try {
    console.log('Validating draft:', id)
    await draftsStore.validateDraft(id)
    console.log('Validation complete')
  } catch (error) {
    console.error('Failed to validate draft:', error)
    alert(`Failed to validate: ${error}`)
  }
}

const handleDelete = async (id: string, source: string) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      if (source === 'google') {
        // Delete from Google Calendar
        const response = await fetch('http://localhost:8000/api/CalendarSync/deleteGoogleEvent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: 'user123', eventId: id })
        })
        const data = await response.json()
        if (data.error) {
          alert(`Failed to delete: ${data.error}`)
        } else {
          // Refresh Google Calendar events to reflect deletion
          await fetchGoogleEvents()
          // Also clear any active filters
          filteredEventIds.value = null
        }
      } else {
        // Delete local draft
        await draftsStore.deleteDraft(id)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert(`Failed to delete: ${error}`)
    }
  }
}
</script>
