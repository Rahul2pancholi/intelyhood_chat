class Billing::PortalSessionService
  pattr_initialize [:account]

  # Razorpay has no hosted "customer portal" like Stripe's Billing Portal —
  # the closest equivalent is the subscription's own short_url, which lets the
  # customer view status and payment method from Razorpay's hosted page.
  # Re-fetched (not read from our cached copy) so it reflects Razorpay's
  # current state even if it changed since checkout.
  def perform
    subscription_id = account.subscription&.razorpay_subscription_id
    raise ArgumentError, 'account has no active razorpay subscription' if subscription_id.blank?

    Razorpay::Subscription.fetch(subscription_id)
  end
end
