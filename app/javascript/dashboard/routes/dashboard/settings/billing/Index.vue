<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAlert } from 'dashboard/composables';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import BillingAPI from 'dashboard/api/billing';

import BillingMeter from './components/BillingMeter.vue';
import BillingCard from './components/BillingCard.vue';
import DetailItem from './components/DetailItem.vue';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import SettingsLayout from '../SettingsLayout.vue';
import ButtonV4 from 'next/button/Button.vue';

const { t } = useI18n();

const isLoading = ref(true);
const isRedirecting = ref(false);
const subscription = ref(null);
const usage = ref({ agents: 0, inboxes: 0 });
const plans = ref([]);

const currentPlan = computed(() => subscription.value?.plan);

const subscriptionRenewsOn = computed(() => {
  if (!subscription.value?.current_period_end) return '';
  return format(
    new Date(subscription.value.current_period_end),
    'dd MMM, yyyy'
  );
});

const fetchBillingDetails = async () => {
  isLoading.value = true;
  try {
    const response = await BillingAPI.get();
    subscription.value = response.data.subscription;
    usage.value = response.data.usage;
    plans.value = response.data.plans;
  } catch (error) {
    useAlert(t('BILLING_SETTINGS.FETCH_ERROR'));
  } finally {
    isLoading.value = false;
  }
};

const upgradeToPlan = async plan => {
  isRedirecting.value = true;
  try {
    const response = await BillingAPI.createCheckoutSession(plan.id);
    window.location.href = response.data.url;
  } catch (error) {
    isRedirecting.value = false;
    useAlert(t('BILLING_SETTINGS.CHECKOUT_ERROR'));
  }
};

const openBillingPortal = async () => {
  isRedirecting.value = true;
  try {
    const response = await BillingAPI.createPortalSession();
    window.location.href = response.data.url;
  } catch (error) {
    isRedirecting.value = false;
    useAlert(t('BILLING_SETTINGS.PORTAL_ERROR'));
  }
};

onMounted(fetchBillingDetails);
</script>

<template>
  <SettingsLayout :is-loading="isLoading">
    <template #header>
      <BaseSettingsHeader
        :title="$t('BILLING_SETTINGS.TITLE')"
        :description="$t('BILLING_SETTINGS.DESCRIPTION')"
      />
    </template>
    <template #body>
      <section class="grid gap-4">
        <BillingCard
          :title="$t('BILLING_SETTINGS.CURRENT_PLAN.TITLE')"
          :description="$t('BILLING_SETTINGS.MANAGE_SUBSCRIPTION.DESCRIPTION')"
        >
          <template #action>
            <ButtonV4
              sm
              solid
              blue
              :is-loading="isRedirecting"
              :disabled="isRedirecting"
              @click="openBillingPortal"
            >
              {{ $t('BILLING_SETTINGS.MANAGE_SUBSCRIPTION.BUTTON_TXT') }}
            </ButtonV4>
          </template>
          <div
            class="grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-1 gap-2 divide-x divide-n-weak"
          >
            <DetailItem
              :label="$t('BILLING_SETTINGS.CURRENT_PLAN.TITLE')"
              :value="currentPlan?.name || t('BILLING_SETTINGS.NO_PLAN')"
            />
            <DetailItem
              v-if="subscription?.seats"
              :label="$t('BILLING_SETTINGS.CURRENT_PLAN.SEAT_COUNT')"
              :value="subscription.seats"
            />
            <DetailItem
              v-if="subscriptionRenewsOn"
              :label="$t('BILLING_SETTINGS.CURRENT_PLAN.RENEWS_ON')"
              :value="subscriptionRenewsOn"
            />
            <DetailItem
              v-if="subscription?.status"
              :label="$t('BILLING_SETTINGS.STATUS_LABEL')"
              :value="subscription.status"
            />
          </div>
          <div class="px-5 grid gap-3 mt-2">
            <BillingMeter
              v-if="currentPlan?.max_agents"
              :title="$t('BILLING_SETTINGS.USAGE.AGENTS')"
              :consumed="usage.agents"
              :total-count="currentPlan.max_agents"
            />
            <BillingMeter
              v-if="currentPlan?.max_inboxes"
              :title="$t('BILLING_SETTINGS.USAGE.INBOXES')"
              :consumed="usage.inboxes"
              :total-count="currentPlan.max_inboxes"
            />
          </div>
        </BillingCard>

        <BillingCard
          :title="$t('BILLING_SETTINGS.AVAILABLE_PLANS')"
          description=""
        >
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 px-5 pb-4">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="border border-n-weak rounded-lg p-4 flex flex-col gap-2"
              :class="{ 'border-n-brand': currentPlan?.id === plan.id }"
            >
              <h4 class="text-n-slate-12 font-medium">{{ plan.name }}</h4>
              <p class="text-n-slate-11 text-sm">
                {{
                  plan.price
                    ? `$${plan.price}/${plan.billing_interval}`
                    : $t('BILLING_SETTINGS.CUSTOM_PRICING')
                }}
              </p>
              <ButtonV4
                sm
                :solid="currentPlan?.id !== plan.id"
                :faded="currentPlan?.id === plan.id"
                blue
                :disabled="currentPlan?.id === plan.id || isRedirecting"
                @click="upgradeToPlan(plan)"
              >
                {{
                  currentPlan?.id === plan.id
                    ? $t('BILLING_SETTINGS.CURRENT_PLAN_LABEL')
                    : $t('BILLING_SETTINGS.UPGRADE')
                }}
              </ButtonV4>
            </div>
          </div>
        </BillingCard>
      </section>
    </template>
  </SettingsLayout>
</template>
