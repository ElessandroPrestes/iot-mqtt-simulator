<template>
  <div :class="['skeleton', $attrs.class]" :style="{ height: height || undefined }" />
</template>

<script setup>
defineProps({
  height: { type: String, default: '' },
});
</script>
