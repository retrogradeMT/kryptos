<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Letter Frequency</h2>

    <div class="flex flex-wrap items-center gap-3 mb-2 text-sm">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" :checked="caseSensitive" @change="emit('update:caseSensitive', ($event.target as HTMLInputElement).checked)" />
        <span>Case‑sensitive</span>
      </label>
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" :checked="includeNonAlpha" @change="emit('update:includeNonAlpha', ($event.target as HTMLInputElement).checked)" />
        <span>Include non‑A–Z</span>
      </label>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="text-left border-b">
            <th class="py-1 pr-2">Char</th>
            <th class="py-1 pr-2">Count</th>
            <th class="py-1">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.char" class="border-b last:border-0">
            <td class="py-1 pr-2 font-kryptos">{{ row.char }}</td>
            <td class="py-1 pr-2">{{ row.count }}</td>
            <td class="py-1">{{ row.pct.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{ text?: string; caseSensitive?: boolean; includeNonAlpha?: boolean }>(), {
  text: '',
  caseSensitive: false,
  includeNonAlpha: false,
})
const emit = defineEmits<{ (e:'update:caseSensitive', v:boolean):void; (e:'update:includeNonAlpha', v:boolean):void }>()

const caseSensitive = computed(() => props.caseSensitive)
const includeNonAlpha = computed(() => props.includeNonAlpha)

function normalize(s:string) { return props.caseSensitive ? s : s.toUpperCase() }

const rows = computed(() => {
  const s = normalize(props.text || '')
  const counts = new Map<string, number>()
  for (const ch of s) {
    const isAlpha = /[A-Z]/.test(ch)
    if (!isAlpha && !props.includeNonAlpha) continue
    counts.set(ch, (counts.get(ch) || 0) + 1)
  }
  const total = Array.from(counts.values()).reduce((a,b)=>a+b,0) || 1
  return Array.from(counts.entries())
    .map(([char,count]) => ({ char, count, pct: (count*100)/total }))
    .sort((a,b) => b.count - a.count || a.char.localeCompare(b.char))
})
</script>

<style scoped></style>
