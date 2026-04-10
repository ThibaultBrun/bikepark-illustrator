<template>
  <section class="panel placeholder-panel">
    <div class="placeholder-icon" aria-hidden="true">
      <SidebarIcon name="export" />
    </div>
    <h2>Export</h2>
    <p>Section reservee aux options d export et de rendu final.</p>
  </section>
</template>

<script setup lang="ts">
import SidebarIcon from './SidebarIcon.vue'
</script>

<style scoped>
.panel {
  margin-bottom: 16px;
  padding: 14px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
}

.placeholder-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.placeholder-panel h2 {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.placeholder-panel p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.28);
  color: #dbeafe;
}
</style>
