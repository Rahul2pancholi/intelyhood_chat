<script setup>
import Icon from 'dashboard/components-next/icon/Icon.vue';

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  noRecordsFound: {
    type: Boolean,
    default: false,
  },
  loadingMessage: {
    type: String,
    default: '',
  },
  noRecordsMessage: {
    type: String,
    default: '',
  },
  emptyStateIcon: {
    type: String,
    default: 'i-lucide-inbox',
  },
});
</script>

<template>
  <div class="flex flex-col w-full h-full gap-4 font-inter">
    <slot name="header" />
    <!-- Added to render any templates that should be rendered before body -->
    <main>
      <slot name="preBody" />
      <slot v-if="isLoading" name="loading">
        <woot-loading-state :message="loadingMessage" />
      </slot>
      <div
        v-else-if="noRecordsFound"
        class="flex flex-1 flex-col items-center justify-center gap-3 py-16"
      >
        <span
          class="inline-flex items-center justify-center size-9 rounded-xl bg-n-alpha-2 text-n-slate-10 flex-shrink-0"
        >
          <Icon :icon="emptyStateIcon" class="size-5" />
        </span>
        <p class="text-n-slate-12 text-base text-center px-4">
          {{ noRecordsMessage }}
        </p>
      </div>
      <slot v-else name="body" />
      <!-- Do not delete the slot below. It is required to render anything that is not defined in the above slots. -->
      <slot />
    </main>
  </div>
</template>
