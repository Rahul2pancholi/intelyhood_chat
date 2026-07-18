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
    <path
      fill-rule="evenodd"
      fill="#3B8CFF"
      d="M120 20 A100 100 0 1 1 120 220 A100 100 0 1 1 120 20 Z M100 84 H156 A22 22 0 0 1 178 106 V184 L100 184 A22 22 0 0 1 78 162 V106 A22 22 0 0 1 100 84 Z"
    />
  </svg>
</template>
