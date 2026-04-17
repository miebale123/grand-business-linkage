<script setup lang="ts">
import { onMounted } from 'vue'

import { useAuthStore } from '@/modules/auth'

const auth = useAuthStore()

onMounted(() => {
  void auth.hydrate()
})
</script>

<template>
  <RouterView v-if="auth.ready" />
  <div v-else class="app-loading">
    <div class="app-loading__spinner" />
  </div>
</template>

<style scoped>
.app-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg);
}

.app-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
