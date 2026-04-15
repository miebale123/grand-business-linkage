<template>
  <div class="image-upload">
    <label class="upload-area" :class="{ 'has-image': modelValue, dragging: isDragging }">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="upload-input"
        @change="handleFileSelect"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
      />
      <div v-if="!modelValue" class="upload-placeholder">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <p class="upload-text">{{ placeholder }}</p>
        <p class="upload-hint">Click or drag image here</p>
      </div>
      <div v-else class="upload-preview">
        <img :src="modelValue" :alt="alt" class="preview-image" />
        <button type="button" class="remove-btn" @click.stop="removeImage">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </label>
    <p v-if="uploading" class="upload-status">Uploading...</p>
    <p v-if="error" class="upload-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import * as api from '@/shared/api/api'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  alt?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const error = ref('')

function removeImage() {
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleFile(file: File) {
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image must be smaller than 5MB'
    return
  }

  error.value = ''
  uploading.value = true

  try {
    const url = await api.uploadImage(file)
    emit('update:modelValue', url)
  } catch (err) {
    error.value = 'Failed to upload image. Please try again.'
    console.error('Image upload failed:', err)
  } finally {
    uploading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    handleFile(file)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    handleFile(file)
  }
}
</script>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-area {
  display: block;
  border: 2px dashed var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.upload-area:hover {
  border-color: var(--primary);
  background: var(--surface-soft);
}

.upload-area.dragging {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.upload-area.has-image {
  border-style: solid;
  border-color: transparent;
}

.upload-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--muted);
}

.upload-text {
  margin-top: 12px;
  font-weight: 500;
  color: var(--text);
}

.upload-hint {
  margin-top: 4px;
  font-size: 0.85rem;
}

.upload-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-status {
  font-size: 0.85rem;
  color: var(--muted);
}

.upload-error {
  font-size: 0.85rem;
  color: var(--error);
}
</style>
