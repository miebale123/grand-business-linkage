<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    body: string
    meta?: string
    actionLabel?: string
    actionDisabled?: boolean
  }>(),
  {
    meta: '',
    actionLabel: '',
    actionDisabled: false,
  },
)

const emit = defineEmits<{
  action: []
}>()

const hasFooter = computed(() => Boolean(props.meta || props.actionLabel))

function handleAction() {
  emit('action')
}
</script>

<template>
  <div class="bl-auth-note">
    <p class="bl-auth-note__title">{{ title }}</p>
    <p class="bl-auth-note__body">{{ body }}</p>

    <div v-if="hasFooter" class="bl-auth-note__footer">
      <p v-if="meta" class="bl-auth-note__meta">{{ meta }}</p>
      <button
        v-if="actionLabel"
        type="button"
        class="bl-auth-mini-button"
        :disabled="actionDisabled"
        @click="handleAction"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
