class Billing::PortalSessionService
  pattr_initialize [:account]

  def perform
    Stripe::BillingPortal::Session.create(
      customer: account.subscription&.stripe_customer_id,
      return_url: "#{ENV.fetch('FRONTEND_URL', nil)}/app/accounts/#{account.id}/settings/billing"
    )
  end
end
