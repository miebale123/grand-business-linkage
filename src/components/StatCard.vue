<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  detail: string
}>()
</script>

<template>
  <article class="stat-card">
    <h3>{{ label }}</h3>
    <div class="stat-value">{{ value }}</div>
    <p class="muted" style="margin: 10px 0 0">{{ detail }}</p>
  </article>
</template>
