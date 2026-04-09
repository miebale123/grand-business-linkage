<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  detail: string
}>()
</script>

<template>
  <article class="stat-card">
    <p class="stat-label">{{ label }}</p>
    <div class="stat-value">{{ value }}</div>
    <p class="stat-detail">{{ detail }}</p>
  </article>
</template>
