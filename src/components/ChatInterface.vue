<template>
  <div class="bg-gray-800 rounded-lg shadow-xl flex flex-col h-[600px] border border-gray-700">
    <div class="bg-gray-800 border-b border-gray-700 p-4 rounded-t-lg">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-white">Chat</h2>
          <p class="text-sm text-gray-400">Ask me to create, edit, or delete events</p>
        </div>
        <button
          @click="clearChat"
          class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 border border-gray-600"
          title="Clear chat history"
        >
          Clear Chat
        </button>
      </div>
    </div>

    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800">
      <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.isUser ? 'justify-end' : 'justify-start'">
        <div class="max-w-[80%] rounded-lg p-3" :class="message.isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'">
          <p class="text-sm">{{ message.text }}</p>
          <div v-if="message.action" class="mt-2 pt-2 border-t border-opacity-20" :class="message.isUser ? 'border-white' : 'border-gray-400'">
            <div v-if="!message.action.confirmed">
              <p class="text-xs font-semibold mb-1">
                <span v-if="message.action.type === 'create'">📅 Create Event?</span>
                <span v-else-if="message.action.type === 'edit'">✏️ Edit Event?</span>
                <span v-else-if="message.action.type === 'delete'">🗑️ Delete Event?</span>
              </p>
              <div v-if="message.action.event">
                <p class="text-xs"><strong>{{ message.action.event.title }}</strong></p>
                <p class="text-xs">{{ formatDate(message.action.event.startTime) }} - {{ formatDate(message.action.event.endTime) }}</p>
                <p class="text-xs" v-if="message.action.event.location">📍 {{ message.action.event.location }}</p>
                <p class="text-xs" v-if="message.action.event.participants && message.action.event.participants.length > 0">
                  👥 {{ Array.from(message.action.event.participants).join(', ') }}
                </p>
              </div>
              <div class="flex gap-2 mt-2">
                <button 
                  @click="confirmAction(index)"
                  class="text-xs px-3 py-1 rounded"
                  :class="message.isUser ? 'bg-white text-blue-600' : 'bg-green-600 text-white hover:bg-green-700'"
                >
                  Accept
                </button>
                <button 
                  @click="rejectAction(index)"
                  class="text-xs px-3 py-1 rounded"
                  :class="message.isUser ? 'bg-white text-blue-600' : 'bg-red-600 text-white hover:bg-red-700'"
                >
                  Reject
                </button>
              </div>
            </div>
            <div v-else>
              <p class="text-xs font-semibold mb-1">
                <span v-if="message.action.type === 'create'">✓ Event Created</span>
                <span v-else-if="message.action.type === 'edit'">✓ Event Edited</span>
                <span v-else-if="message.action.type === 'delete'">✓ Event Deleted</span>
              </p>
              <div v-if="message.action.event && message.action.type !== 'delete'">
                <p class="text-xs"><strong>{{ message.action.event.title }}</strong></p>
                <p class="text-xs">{{ formatDate(message.action.event.startTime) }} - {{ formatDate(message.action.event.endTime) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="flex justify-start">
        <div class="bg-gray-700 rounded-lg p-3">
          <p class="text-sm text-gray-300">Thinking...</p>
        </div>
      </div>
    </div>

    <div class="p-4 border-t border-gray-700 bg-gray-800">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="inputText"
          type="text"
          placeholder="e.g., 'Meeting with Sarah tomorrow at 2pm in room 123'"
          class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="loading"
        />
        <button
          type="submit"
          :disabled="loading || !inputText.trim()"
          class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import axios from 'axios'
import { useDraftsStore } from '../stores/drafts'

const API_BASE = 'http://localhost:8000/api'
const userId = 'user123'
const draftsStore = useDraftsStore()
const chatContainer = ref<HTMLElement | null>(null)

interface Message {
  text: string
  isUser: boolean
  action?: {
    type: 'create' | 'edit' | 'delete'
    event?: any
    eventId?: string
    confirmed?: boolean
  }
}

// Load chat history from localStorage
const loadChatHistory = () => {
  const saved = localStorage.getItem('fastcal_chat_history')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return [{
        text: "Hi! I'm FastCal. Tell me what event you'd like to schedule, and I'll add it directly to your calendar. Try something like 'Team meeting tomorrow at 3pm' or 'Lunch with Alex next Friday at noon'.",
        isUser: false,
      }]
    }
  }
  return [{
    text: "Hi! I'm FastCal. Tell me what event you'd like to schedule, and I'll add it directly to your calendar. Try something like 'Team meeting tomorrow at 3pm' or 'Lunch with Alex next Friday at noon'.",
    isUser: false,
  }]
}

const messages = ref<Message[]>(loadChatHistory())
const inputText = ref('')
const loading = ref(false)

// Auto-scroll to bottom when messages change
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// Watch for message changes and auto-scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Save chat history to localStorage
const saveChatHistory = () => {
  localStorage.setItem('fastcal_chat_history', JSON.stringify(messages.value))
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return

  const userMessage = inputText.value
  messages.value.push({
    text: userMessage,
    isUser: true,
  })
  saveChatHistory()

  inputText.value = ''
  loading.value = true

  try {
    // Get existing events from Google Calendar for context (not local drafts)
    let googleEvents: any[] = []
    try {
      const gcalResponse = await axios.post(`${API_BASE}/CalendarSync/getGoogleEvents`, {
        user: userId,
      })
      if (gcalResponse.data.events) {
        googleEvents = gcalResponse.data.events.map((e: any) => ({
          id: e.id, // Google Calendar ID
          title: e.summary,
          startTime: e.start?.dateTime || e.start?.date,
          endTime: e.end?.dateTime || e.end?.date,
          location: e.location || '',
          attendees: e.attendees?.map((a: any) => a.email) || []
        }))
      }
    } catch (e) {
      console.error('Failed to fetch Google Calendar events for context:', e)
    }
    
    const existingEvents = googleEvents

    // Call IntentParser to parse the natural language
    const response = await axios.post(`${API_BASE}/IntentParser/parseWithAI`, {
      user: userId,
      utterance: userMessage,
      context: {
        currentDate: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        existingEvents: existingEvents,
      }
    })

    if (response.data.error) {
      messages.value.push({
        text: `Sorry, I couldn't understand that. ${response.data.error}`,
        isUser: false,
      })
    } else {
      const parsedEvent = response.data
      const eventData = parsedEvent.draftEvent
      const intent = parsedEvent.context?.intent || 'create'
      
      // Handle query intent - just show the message, no action needed
      if (intent === 'query') {
        messages.value.push({
          text: eventData.message || "I looked at your calendar.",
          isUser: false,
        })
      } else if (intent === 'search') {
        // Handle search intent - show filtered results
        const searchResults = parsedEvent.context?.searchResults || []
        const count = searchResults.length
        console.log('Search results from backend:', searchResults)
        console.log('Full parsed event:', parsedEvent)
        
        // Build response message with time frame info
        let responseText = `Found ${count} matching event${count !== 1 ? 's' : ''}`
        
        // Add time frame information
        const timeFrame = parsedEvent.context?.timeFrame
        if (timeFrame) {
          const start = new Date(timeFrame.start).toLocaleDateString()
          const end = new Date(timeFrame.end).toLocaleDateString()
          responseText += ` from ${start} to ${end}`
        } else {
          // Default 30-day window
          const now = new Date()
          const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          responseText += ` in the next 30 days (through ${future.toLocaleDateString()})`
        }
        
        if (count > 0) {
          responseText += '. Filtering calendar view...'
        } else {
          responseText += '. Try being more specific or check if events exist in this time range.'
        }
        
        messages.value.push({
          text: responseText,
          isUser: false,
          searchResults: searchResults,
        })
        // Emit event to filter calendar
        if (count > 0) {
          window.dispatchEvent(new CustomEvent('filterCalendar', { detail: searchResults }))
        }
      } else {
        // Show preview and ask for confirmation
        let responseText
        if (intent === 'delete') {
          // For delete, don't show fake event details
          responseText = `Delete this event?`
        } else {
          responseText = `I want to ${intent}: "${eventData.title}"`
          if (eventData.confidence < 0.8) {
            responseText += ` (${Math.round(eventData.confidence * 100)}% confidence)`
          }
        }
        
        messages.value.push({
          text: responseText,
          isUser: false,
          action: {
            type: intent,
            event: intent === 'delete' ? null : eventData, // Don't show event details for delete
            eventId: parsedEvent.context?.eventId, // Include eventId from context
            confirmed: false,
          }
        })
      }
    }
  } catch (error: any) {
    messages.value.push({
      text: `Error: ${error.response?.data?.error || error.message || 'Failed to parse your message'}`,
      isUser: false,
    })
  } finally {
    loading.value = false
    saveChatHistory()
  }
}

const confirmAction = async (messageIndex: number) => {
  const message = messages.value[messageIndex]
  if (!message.action) return

  try {
    if (message.action.type === 'create') {
      const eventData = message.action.event
      const response = await axios.post(`${API_BASE}/EventDrafts/create`, {
        user: userId,
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location || '',
        attendees: Array.from(eventData.participants || []),
        tags: Array.from(eventData.tags || []),
      })

      if (response.data.error) {
        messages.value.push({
          text: `Failed to create event: ${response.data.error}`,
          isUser: false,
        })
      } else {
        message.action.confirmed = true
        await draftsStore.fetchUserDrafts()
        
        // Sync to Google Calendar
        try {
          const syncResponse = await axios.post(`${API_BASE}/CalendarSync/syncToGoogle`, {
            user: userId,
            draftId: response.data._id,
            draftData: {
              title: eventData.title,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              location: eventData.location || '',
              attendees: Array.from(eventData.participants || []),
            }
          })
          
          if (syncResponse.data.googleEventId) {
            // Delete the local draft since it's now in Google Calendar
            await axios.post(`${API_BASE}/EventDrafts/deleteDraft`, {
              draft: response.data._id,
            })
            
            messages.value.push({
              text: `✓ Synced to Google Calendar!`,
              isUser: false,
            })
            
            // Wait a bit for Google Calendar to propagate, then refresh
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshCalendar'))
            }, 2000)
          }
        } catch (e) {
          console.error('Failed to sync to Google Calendar:', e)
        }
      }
    } else if (message.action.type === 'delete') {
      // Use the eventId directly (it's already the MongoDB _id from Gemini)
      console.log('Deleting event with ID:', message.action.eventId)
      console.log('Full action:', message.action)
      
      // Delete from Google Calendar using the same approach as the button
      const googleResponse = await axios.post(`${API_BASE}/CalendarSync/deleteGoogleEvent`, {
        user: userId,
        eventId: message.action.eventId,
      })

      if (googleResponse.data.error) {
        messages.value.push({
          text: `Failed to delete event: ${googleResponse.data.error}`,
          isUser: false,
        })
      } else {
        message.action.confirmed = true
        messages.value.push({
          text: `Event deleted from Google Calendar!`,
          isUser: false,
        })
        // Trigger refresh of Google Calendar events with delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshCalendar'))
        }, 1000)
      }
    } else if (message.action.type === 'edit') {
      // Use the eventId directly (it's already the MongoDB _id from Gemini)
      const eventData = message.action.event
      const response = await axios.post(`${API_BASE}/EventDrafts/updateDraft`, {
        draft: message.action.eventId,
        updates: {
          title: eventData.title,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location || '',
          attendees: Array.from(eventData.participants || []),
          tags: Array.from(eventData.tags || []),
        }
      })

      if (response.data.error) {
        messages.value.push({
          text: `Failed to edit event: ${response.data.error}`,
          isUser: false,
        })
      } else {
        message.action.confirmed = true
        // Refresh the calendar view
        await draftsStore.fetchUserDrafts()
        messages.value.push({
          text: `Event updated successfully!`,
          isUser: false,
        })
      }
    }
    saveChatHistory()
  } catch (error: any) {
    messages.value.push({
      text: `Error: ${error.message}`,
      isUser: false,
    })
  }
}

const rejectAction = (messageIndex: number) => {
  messages.value.push({
    text: "Okay, I won't do that. What else can I help you with?",
    isUser: false,
  })
  saveChatHistory()
}

const clearChat = () => {
  if (confirm('Are you sure you want to clear the chat history?')) {
    localStorage.removeItem('fastcal_chat_history')
    messages.value = [{
      text: "Hi! I'm FastCal. Tell me what event you'd like to schedule, and I'll add it directly to your calendar. Try something like 'Team meeting tomorrow at 3pm' or 'Lunch with Alex next Friday at noon'.",
      isUser: false,
    }]
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>
