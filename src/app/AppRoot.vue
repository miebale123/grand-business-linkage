<script setup lang="ts">
import { onMounted } from 'vue'

import { useAuthStore } from '@/modules/auth'

const auth = useAuthStore()

onMounted(() => {
  void auth.hydrate()
})
</script>

<template>
  <RouterView />
</template>
