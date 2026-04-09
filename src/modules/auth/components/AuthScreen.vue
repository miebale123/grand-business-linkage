<script setup lang="ts">
import '@/modules/auth/auth-page.css'

withDefaults(
  defineProps<{
    kicker: string
    title: string
    copy?: string
    wide?: boolean
  }>(),
  {
    copy: '',
    wide: false,
  },
)
</script>

<template>
  <section class="bl-auth-shell">
    <div class="bl-auth-stage">
      <div class="bl-auth-card" :class="{ 'bl-auth-card--wide': wide }">
        <p class="bl-auth-kicker">{{ kicker }}</p>
        <h1 v-if="title" class="bl-auth-title">{{ title }}</h1>
        <p v-if="copy" class="bl-auth-copy">{{ copy }}</p>
        <slot />
      </div>
    </div>
  </section>
</template>
