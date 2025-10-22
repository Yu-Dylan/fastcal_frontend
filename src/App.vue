<script setup lang="ts">
import DraftForm from './components/DraftForm.vue'
import DraftList from './components/DraftList.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-blue-600 text-white py-6 shadow-lg">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl font-bold">FastCal</h1>
        <p class="text-blue-100 mt-1">Quick event scheduling made easy</p>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DraftForm />
        <DraftList />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
