import { defineStore } from 'pinia'
import { ref } from 'vue'
import { draftsApi, type DraftEvent } from '../api/drafts'

export const useDraftsStore = defineStore('drafts', () => {
  const drafts = ref<DraftEvent[]>([])
  const currentDraft = ref<DraftEvent | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Current user ID (in a real app, this would come from auth)
  const userId = ref('user123')

  async function fetchUserDrafts() {
    loading.value = true
    error.value = null
    try {
      const response = await draftsApi.getUserDrafts(userId.value)
      if (response.success) {
        drafts.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch drafts'
    } finally {
      loading.value = false
    }
  }

  async function createDraft(draft: Omit<DraftEvent, '_id' | 'status'>) {
    loading.value = true
    error.value = null
    try {
      const response = await draftsApi.create({ ...draft, user: userId.value })
      if (response.success) {
        await fetchUserDrafts()
        return response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to create draft'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateDraft(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await draftsApi.validate(id)
      if (response.success) {
        await fetchUserDrafts()
        return response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to validate draft'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDraft(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await draftsApi.delete(id)
      if (response.success) {
        await fetchUserDrafts()
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to delete draft'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    drafts,
    currentDraft,
    loading,
    error,
    userId,
    fetchUserDrafts,
    createDraft,
    validateDraft,
    deleteDraft,
  }
})
