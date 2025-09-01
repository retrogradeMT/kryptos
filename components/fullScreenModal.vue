<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

const emit = defineEmits<{ (e: 'close'): void }>()
const open = defineModel<boolean>({ required: true })
const close = () => { open.value = false; emit('close') }
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape')
    close()
}
watch(open, (v) => { document.documentElement.style.overflow = v ? 'hidden' : '' })
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/60" @click="close"></div>
      <div class="absolute inset-0 flex pointer-events-none">
        <div class="flex flex-col w-screen h-screen bg-white pointer-events-auto">
          <header class="sticky top-0 z-10 flex items-center gap-2 p-4 bg-white border-b">
            <h2 class="text-lg font-semibold">
              <slot name="title">
                Modal
              </slot>
            </h2>
            <button class="w-8 h-8 ml-auto border rounded hover:bg-gray-50" aria-label="Close" @click="close">
              ×
            </button>
          </header>
          <main class="flex-1 min-h-0 p-4 overflow-auto">
            <slot></slot>
          </main>
          <footer class="sticky bottom-0 z-10 p-3 bg-white border-t">
            <slot name="footer">
              <button class="px-3 py-1 border rounded" @click="close">
                Close
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>
