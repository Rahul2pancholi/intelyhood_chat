class Billing::CheckoutSessionService
  pattr_initialize [:account, :plan]

  def perform
    Stripe::Checkout::Session.create(
      {
        customer: stripe_customer_id,
        customer_email: stripe_customer_id ? nil : account.administrators.first&.email,
        mode: 'subscription',
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: "#{frontend_url}/app/accounts/#{account.id}/settings/billing?checkout=success",
        cancel_url: "#{frontend_url}/app/accounts/#{account.id}/settings/billing?checkout=cancelled",
        client_reference_id: account.id,
        metadata: { account_id: account.id }
      }.compact
    )
  end

  private

  def subscription
    @subscription ||= account.subscription || account.create_subscription!(plan: plan)
  end

  def stripe_customer_id
    subscription.stripe_customer_id
  end

  def frontend_url
    ENV.fetch('FRONTEND_URL', nil)
  end
end
