<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const isVisible = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    isVisible.value = val
  },
)

function close() {
  emit('update:modelValue', false)
}

function onConfirm() {
  emit('confirm')
  close()
}

function onCancel() {
  emit('cancel')
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="confirm-dialog-overlay" @click.self="onCancel">
        <div class="confirm-dialog">
          <h3 class="confirm-dialog__title">{{ title }}</h3>
          <p class="confirm-dialog__message">{{ message }}</p>
          <div class="confirm-dialog__actions">
            <button class="btn-ghost" type="button" @click="onCancel">
              {{ cancelText || 'Cancel' }}
            </button>
            <button class="btn-primary" type="button" @click="onConfirm">
              {{ confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.confirm-dialog__title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.confirm-dialog__message {
  margin: 0 0 1.5rem;
  color: #6b7280;
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
