<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Create Event Draft</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Title</label>
        <input
          v-model="form.title"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Meeting with team"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Start Time</label>
          <input
            v-model="form.startTime"
            type="datetime-local"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">End Time</label>
          <input
            v-model="form.endTime"
            type="datetime-local"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Location</label>
        <input
          v-model="form.location"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Conference Room A"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Attendees (comma-separated)</label>
        <input
          v-model="attendeesInput"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="alice@example.com, bob@example.com"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Creating...' : 'Create Draft' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDraftsStore } from '../stores/drafts'

const draftsStore = useDraftsStore()

const form = ref({
  title: '',
  startTime: '',
  endTime: '',
  location: '',
})

const attendeesInput = ref('')
const loading = computed(() => draftsStore.loading)

const handleSubmit = async () => {
  try {
    const attendees = attendeesInput.value
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    await draftsStore.createDraft({
      user: draftsStore.userId,
      title: form.value.title,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      location: form.value.location,
      attendees,
      tags: [],
    })

    // Reset form
    form.value = {
      title: '',
      startTime: '',
      endTime: '',
      location: '',
    }
    attendeesInput.value = ''
  } catch (error) {
    console.error('Failed to create draft:', error)
  }
}
</script>
