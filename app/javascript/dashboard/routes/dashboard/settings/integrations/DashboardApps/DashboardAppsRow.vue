<script setup>
import { BaseTableRow, BaseTableCell } from 'dashboard/components-next/table';
import Button from 'dashboard/components-next/button/Button.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

defineProps({
  app: {
    type: Object,
    default: () => ({}),
  },
});

defineEmits(['edit', 'delete']);
</script>

<template>
  <BaseTableRow :item="app">
    <template #default>
      <BaseTableCell>
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="inline-flex items-center justify-center size-8 rounded-lg bg-n-alpha-2 text-n-slate-11 flex-shrink-0"
          >
            <Icon icon="i-lucide-layout-dashboard" class="size-4" />
          </span>
          <span
            class="text-body-main text-n-slate-12 truncate block"
            :title="app.title"
          >
            {{ app.title }}
          </span>
        </div>
      </BaseTableCell>

      <BaseTableCell>
        <span
          class="text-body-main text-n-slate-11 truncate block"
          :title="app.content[0].url"
        >
          {{ app.content[0].url }}
        </span>
      </BaseTableCell>

      <BaseTableCell align="end" class="w-24">
        <div class="flex justify-end gap-3 flex-shrink-0">
          <Button
            v-tooltip.top="
              $t('INTEGRATION_SETTINGS.DASHBOARD_APPS.LIST.EDIT_TOOLTIP')
            "
            icon="i-woot-edit-pen"
            slate
            sm
            @click="$emit('edit', app)"
          />
          <Button
            v-tooltip.top="
              $t('INTEGRATION_SETTINGS.DASHBOARD_APPS.LIST.DELETE_TOOLTIP')
            "
            icon="i-woot-bin"
            slate
            sm
            class="hover:enabled:text-n-ruby-11 hover:enabled:bg-n-ruby-2"
            @click="$emit('delete', app)"
          />
        </div>
      </BaseTableCell>
    </template>
  </BaseTableRow>
</template>
