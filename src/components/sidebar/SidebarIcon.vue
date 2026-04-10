<template>
  <component :is="iconComponent" class="sidebar-icon" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Blend, Download, Map, Route, Shapes, Mountain } from 'lucide-vue-next'
import type { SidebarSectionId } from './types'

type SidebarIconName = SidebarSectionId | 'blend' | 'mountain'

const props = defineProps<{
  name: SidebarIconName
}>()

const iconMap = {
  track: Route,
  symbol: Shapes,
  map: Map,
  export: Download,
  blend: Blend,
  mountain: Mountain,
} satisfies Record<SidebarIconName, object>

const iconComponent = computed(() => iconMap[props.name])
</script>

<style scoped>
.sidebar-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}
</style>
