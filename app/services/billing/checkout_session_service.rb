class Billing::CheckoutSessionService
  pattr_initialize [:account, :plan]

  # Razorpay subscriptions have no fixed end date by default; total_count is
  # required by the API, so we request a long-running billing cycle count and
  # rely on cancellation (see Billing::PortalSessionService) rather than expiry.
  TOTAL_BILLING_CYCLES = 120

  def perform
    razorpay_subscription = Razorpay::Subscription.create(
      {
        plan_id: plan.razorpay_plan_id,
        customer_notify: 1,
        total_count: TOTAL_BILLING_CYCLES,
        notes: { account_id: account.id }
      }.compact
    )

    subscription.update!(plan: plan, razorpay_subscription_id: razorpay_subscription.id,
                         razorpay_short_url: razorpay_subscription.short_url)
    razorpay_subscription
  end

  private

  def subscription
    @subscription ||= account.subscription || account.create_subscription!(plan: plan)
  end
end
