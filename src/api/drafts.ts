import apiClient from './client'

export interface DraftEvent {
  _id?: string
  user: string
  title: string
  startTime: string
  endTime: string
  location: string
  attendees: string[]
  tags: string[]
  status?: string
}

export const draftsApi = {
  // Create a new draft event
  async create(draft: Omit<DraftEvent, '_id' | 'status'>) {
    const response = await apiClient.post('/EventDrafts/create', {
      user: draft.user,
      title: draft.title,
      startTime: draft.startTime,
      endTime: draft.endTime,
      location: draft.location,
      attendees: draft.attendees,
      tags: draft.tags,
    })
    return response.data
  },

  // Get all drafts for a user
  async getUserDrafts(userId: string) {
    const response = await apiClient.post('/EventDrafts/getUserDrafts', { user: userId })
    return response.data
  },

  // Validate a draft
  async validate(id: string) {
    const response = await apiClient.post('/EventDrafts/validate', { id })
    return response.data
  },

  // Update a draft
  async update(id: string, updates: Partial<DraftEvent>) {
    const response = await apiClient.post('/EventDrafts/modify', {
      id,
      ...updates,
    })
    return response.data
  },

  // Delete a draft
  async delete(id: string) {
    const response = await apiClient.post('/EventDrafts/remove', { id })
    return response.data
  },
}
