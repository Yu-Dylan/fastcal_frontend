<template>
  <div class="login-container">
    <div class="login-card">
      <h1>FastCal</h1>
      <p>Sign in with your Google account to get started</p>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="loading" class="loading">
        Signing in...
      </div>
      
      <button 
        @click="handleGoogleLogin" 
        :disabled="loading"
        class="google-login-btn"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
      
      <div class="info-text">
        <p>After signing in, you'll be asked to connect your Google Calendar to sync events.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '../api/client.ts'

const loading = ref(false)
const error = ref('')

async function handleGoogleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    // Get Google OAuth URL for login
    const response = await apiClient.post('/CalendarSync/getGoogleLoginUrl')
    
    if (response.data.url) {
      // Store a flag to indicate we're logging in (not connecting calendar)
      localStorage.setItem('auth_flow', 'login')
      
      // Redirect to Google OAuth
      window.location.href = response.data.url
    } else {
      error.value = 'Failed to get login URL'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to start login process'
  } finally {
    loading.value = false
  }
}

// OAuth callback is now handled by the dedicated callback page
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5em;
}

p {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-login-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #4285f4;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
}

.google-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.loading {
  color: #666;
  margin-bottom: 20px;
  font-style: italic;
}

.info-text {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.info-text p {
  font-size: 0.9em;
  color: #888;
  margin-bottom: 0;
}
</style>
