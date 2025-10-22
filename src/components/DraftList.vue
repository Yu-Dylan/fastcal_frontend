<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Your Event Drafts</h2>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Loading drafts...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <p class="text-sm text-gray-600">Make sure your backend server is running on port 8000</p>
    </div>

    <div v-else-if="drafts.length === 0" class="text-center py-8">
      <p class="text-gray-500">No drafts yet. Create your first event!</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="draft in drafts"
        :key="draft._id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold">{{ draft.title }}</h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ formatDate(draft.startTime) }} - {{ formatDate(draft.endTime) }}
            </p>
            <p class="text-sm text-gray-600">📍 {{ draft.location || 'No location' }}</p>
            <p v-if="draft.attendees.length > 0" class="text-sm text-gray-600 mt-1">
              👥 {{ draft.attendees.join(', ') }}
            </p>
            <span
              class="inline-block mt-2 px-2 py-1 text-xs rounded"
              :class="getStatusClass(draft.status)"
            >
              {{ draft.status }}
            </span>
          </div>

          <div class="flex gap-2">
            <button
              v-if="draft.status === 'Created'"
              @click="handleValidate(draft._id!)"
              class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Validate
            </button>
            <button
              @click="handleDelete(draft._id!)"
              class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDraftsStore } from '../stores/drafts'

const draftsStore = useDraftsStore()

const drafts = computed(() => draftsStore.drafts)
const loading = computed(() => draftsStore.loading)
const error = computed(() => draftsStore.error)

onMounted(() => {
  draftsStore.fetchUserDrafts()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
    await draftsStore.validateDraft(id)
  } catch (error) {
    console.error('Failed to validate draft:', error)
  }
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this draft?')) {
    try {
      await draftsStore.deleteDraft(id)
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }
}
</script>
