<script setup lang="ts">
import { onMounted, computed } from 'vue'
import ChatInterface from './components/ChatInterface.vue'
import DraftList from './components/DraftList.vue'
import LoginPage from './components/LoginPage.vue'
import { useAuth } from './composables/useAuth.ts'

const { user, loading, isAuthenticated, checkAuth, logout } = useAuth()

onMounted(async () => {
  // Check for token in URL (from OAuth callback)
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  
  if (token) {
    console.log('Found token in URL, storing...')
    localStorage.setItem('session_token', token)
    // Clean up URL
    window.history.replaceState({}, '', '/')
  }
  
  await checkAuth()
  
  // Handle OAuth callback for calendar connection
  const code = urlParams.get('code')
  const authFlow = localStorage.getItem('auth_flow')
  
  if (code && authFlow === 'calendar') {
    // This is a calendar connection callback
    try {
      const response = await fetch('http://localhost:8000/api/CalendarSync/handleGoogleCallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user.value.user, code })
      })
      const data = await response.json()
      
      if (data.success) {
        // Calendar connected successfully
        localStorage.removeItem('auth_flow')
        // Clean up URL
        window.history.replaceState({}, '', '/')
      }
    } catch (e) {
      console.error('Failed to connect calendar:', e)
    }
  }
})

const connectGoogle = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/CalendarSync/getGoogleAuthUrl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user.value.user })
    })
    const data = await response.json()
    if (data.url) {
      localStorage.setItem('auth_flow', 'calendar')
      window.location.href = data.url
    }
  } catch (e) {
    console.error('Failed to get auth URL:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-white text-xl">Loading...</div>
    </div>
    
    <!-- Login page -->
    <LoginPage v-else-if="!isAuthenticated" />
    
    <!-- Main app -->
    <main v-else class="container mx-auto px-4 py-6">
      <!-- Header with user info and logout -->
      <header class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-white">FastCal</h1>
            <p class="text-gray-400">Welcome, {{ user?.name || user?.email }}</p>
          </div>
          <div class="flex gap-4 items-center">
            <button
              @click="connectGoogle"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Connect Calendar
            </button>
            <button
              @click="logout"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DraftList />
        <ChatInterface />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
