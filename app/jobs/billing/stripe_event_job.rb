class Billing::StripeEventJob < ApplicationJob
  queue_as :default

  def perform(event)
    event = event.with_indifferent_access
    object = event[:data][:object]

    case event[:type]
    when 'checkout.session.completed'
      handle_checkout_completed(object)
    when 'customer.subscription.updated', 'customer.subscription.created'
      handle_subscription_updated(object)
    when 'customer.subscription.deleted'
      handle_subscription_deleted(object)
    end
  end

  private

  def handle_checkout_completed(session)
    account_id = session[:client_reference_id] || session.dig(:metadata, :account_id)
    subscription = AccountSubscription.find_by(account_id: account_id)
    return if subscription.blank?

    subscription.update!(stripe_customer_id: session[:customer], stripe_subscription_id: session[:subscription])
  end

  def handle_subscription_updated(stripe_subscription)
    subscription = AccountSubscription.find_by(stripe_subscription_id: stripe_subscription[:id]) ||
                    AccountSubscription.find_by(stripe_customer_id: stripe_subscription[:customer])
    return if subscription.blank?

    plan = Plan.find_by(stripe_price_id: stripe_subscription.dig(:items, :data, 0, :price, :id))
    subscription.update!(
      plan: plan || subscription.plan,
      status: map_status(stripe_subscription[:status]),
      stripe_subscription_id: stripe_subscription[:id],
      current_period_end: Time.zone.at(stripe_subscription[:current_period_end])
    )
  end

  def handle_subscription_deleted(stripe_subscription)
    subscription = AccountSubscription.find_by(stripe_subscription_id: stripe_subscription[:id])
    return if subscription.blank?

    subscription.update!(status: 'canceled')
  end

  def map_status(stripe_status)
    return 'active' if stripe_status == 'active'
    return 'past_due' if %w[past_due unpaid incomplete].include?(stripe_status)
    return 'canceled' if %w[canceled incomplete_expired].include?(stripe_status)

    'trialing'
  end
end
