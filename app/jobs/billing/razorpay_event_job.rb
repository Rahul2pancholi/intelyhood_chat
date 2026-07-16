class Billing::RazorpayEventJob < ApplicationJob
  queue_as :default

  # https://razorpay.com/docs/webhooks/payloads/subscriptions/
  STATUS_MAP = {
    'created' => 'trialing',
    'authenticated' => 'trialing',
    'active' => 'active',
    'pending' => 'past_due',
    'halted' => 'past_due',
    'cancelled' => 'canceled',
    'completed' => 'canceled',
    'expired' => 'canceled'
  }.freeze

  def perform(event)
    event = event.with_indifferent_access
    subscription_entity = event.dig(:payload, :subscription, :entity)
    return if subscription_entity.blank?

    case event[:event]
    when 'subscription.activated', 'subscription.charged', 'subscription.pending',
         'subscription.halted', 'subscription.cancelled', 'subscription.completed'
      handle_subscription_update(subscription_entity)
    end
  end

  private

  def handle_subscription_update(subscription_entity)
    subscription = find_subscription(subscription_entity)
    return if subscription.blank?

    plan = Plan.find_by(razorpay_plan_id: subscription_entity[:plan_id]) || subscription.plan
    subscription.update!(
      plan: plan,
      status: STATUS_MAP.fetch(subscription_entity[:status], subscription.status),
      razorpay_subscription_id: subscription_entity[:id],
      current_period_end: subscription_entity[:current_end].present? ? Time.zone.at(subscription_entity[:current_end]) : nil
    )
  end

  def find_subscription(subscription_entity)
    AccountSubscription.find_by(razorpay_subscription_id: subscription_entity[:id]) ||
      AccountSubscription.find_by(account_id: subscription_entity.dig(:notes, :account_id))
  end
end
