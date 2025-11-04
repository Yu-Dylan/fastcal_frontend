import { ref, computed } from 'vue'
import apiClient from '../api/client.ts'

const user = ref<any>(null)
const loading = ref(true)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)

  async function checkAuth() {
    const token = localStorage.getItem('session_token')
    
    console.log('checkAuth - token:', token ? 'exists' : 'missing')
    
    if (!token) {
      user.value = null
      loading.value = false
      return false
    }

    try {
      console.log('checkAuth - verifying token...')
      const response = await apiClient.post('/Session/verify', { token })
      
      console.log('checkAuth - response:', response.data)
      
      if (response.data.user) {
        user.value = response.data
        console.log('checkAuth - success, user:', user.value)
        return true
      } else if (response.data.error) {
        // Error from server
        console.error('checkAuth - server error:', response.data.error)
        localStorage.removeItem('session_token')
        user.value = null
        return false
      } else {
        // Invalid token
        console.error('checkAuth - invalid response format')
        localStorage.removeItem('session_token')
        user.value = null
        return false
      }
    } catch (error: any) {
      console.error('Auth check failed:', error)
      console.error('Error details:', error.response?.data)
      // Don't remove token on network errors, only on auth errors
      if (error.response?.status === 401) {
        localStorage.removeItem('session_token')
      }
      user.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const token = localStorage.getItem('session_token')
    
    if (token) {
      try {
        await apiClient.post('/Session/end', { token })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    localStorage.removeItem('session_token')
    user.value = null
    window.location.reload()
  }

  function requireAuth() {
    if (!isAuthenticated.value) {
      return false
    }
    return true
  }

  // Initialize auth state
  if (loading.value) {
    checkAuth()
  }

  return {
    user,
    loading,
    isAuthenticated,
    checkAuth,
    logout,
    requireAuth,
  }
}
