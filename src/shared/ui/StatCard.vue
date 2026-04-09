<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  detail: string
}>()
</script>

<template>
  <article class="stat-card">
    <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{{ label }}</p>
    <div class="stat-value">{{ value }}</div>
    <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ detail }}</p>
  </article>
</template>
