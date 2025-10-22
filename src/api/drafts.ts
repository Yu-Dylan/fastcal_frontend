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
    const response = await apiClient.post('/drafts/create', draft)
    return response.data
  },

  // Get a specific draft by ID
  async getById(id: string) {
    const response = await apiClient.get(`/drafts/${id}`)
    return response.data
  },

  // Get all drafts for a user
  async getUserDrafts(userId: string) {
    const response = await apiClient.get(`/drafts/user/${userId}`)
    return response.data
  },

  // Validate a draft
  async validate(id: string) {
    const response = await apiClient.post(`/drafts/${id}/validate`)
    return response.data
  },

  // Update a draft
  async update(id: string, updates: Partial<DraftEvent>) {
    const response = await apiClient.put(`/drafts/${id}`, updates)
    return response.data
  },

  // Delete a draft
  async delete(id: string) {
    const response = await apiClient.delete(`/drafts/${id}`)
    return response.data
  },
}
