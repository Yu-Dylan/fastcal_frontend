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
      
      if (response.error) {
        error.value = response.error
        drafts.value = []
        return
      }
      
      // getByUser returns { drafts: ID[] }, so we need to fetch each draft
      const draftIds = response.drafts || []
      const draftPromises = draftIds.map((id: string) => draftsApi.getDraft(id))
      const draftResponses = await Promise.all(draftPromises)
      
      // Filter out errors and extract draft data
      // Note: backend returns 'id' not '_id'
      drafts.value = draftResponses
        .filter(res => !res.error)
        .map(res => ({
          _id: res.draft.id,  // backend uses 'id' instead of '_id'
          user: res.draft.user,
          title: res.draft.title,
          startTime: res.draft.startTime,
          endTime: res.draft.endTime,
          location: res.draft.location,
          attendees: res.draft.attendees,
          tags: res.draft.tags,
          status: res.draft.status,
        }))
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch drafts'
      drafts.value = []
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
      
      if (response.error) {
        error.value = response.error
        throw new Error(response.error)
      }
      
      await fetchUserDrafts()
      return response
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
      
      if (response.error) {
        error.value = response.error
        throw new Error(response.error)
      }
      
      await fetchUserDrafts()
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
