<script setup>
import { useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');
</script>

<template>
  <img
    v-if="globalConfig.logoThumbnail"
    v-bind="attrs"
    :src="globalConfig.logoThumbnail"
  />
  <svg
    v-else
    v-once
    v-bind="attrs"
    width="16"
    height="16"
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <mask id="intelychat-logo-mark-cut">
        <rect width="240" height="240" fill="#fff" />
        <path
          d="M100 84 h56 a22 22 0 0 1 22 22 v78 l-78 -0 a22 22 0 0 1 -22 -22 v-56 a22 22 0 0 1 22 -22 z"
          fill="#000"
        />
      </mask>
    </defs>
    <circle
      cx="120"
      cy="120"
      r="100"
      fill="#111111"
      mask="url(#intelychat-logo-mark-cut)"
    />
  </svg>
</template>
