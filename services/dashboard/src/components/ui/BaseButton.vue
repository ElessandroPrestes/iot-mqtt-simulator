<template>
  <button 
    class="px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="variantClasses"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary'
  }
});

defineEmits(['click']);

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger': return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
    case 'secondary': return 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400';
    default: return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
  }
});
</script>
