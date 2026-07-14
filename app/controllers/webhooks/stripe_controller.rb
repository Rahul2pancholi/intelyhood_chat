class Webhooks::StripeController < ActionController::API
  def process_payload
    event = verified_event
    return head :bad_request if event.nil?

    Billing::StripeEventJob.perform_later(event.to_hash)
    head :ok
  end

  private

  def verified_event
    secret = ENV.fetch('STRIPE_WEBHOOK_SECRET', nil)
    return if secret.blank?

    payload = request.body.read
    signature = request.headers['Stripe-Signature']
    Stripe::Webhook.construct_event(payload, signature, secret)
  rescue JSON::ParserError, Stripe::SignatureVerificationError
    nil
  end
end
