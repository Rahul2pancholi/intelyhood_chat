class Webhooks::RazorpayController < ActionController::API
  def process_payload
    payload = request.body.read
    return head :bad_request unless verified?(payload)

    event = JSON.parse(payload)
    Billing::RazorpayEventJob.perform_later(event)
    head :ok
  end

  private

  def verified?(payload)
    secret = ENV.fetch('RAZORPAY_WEBHOOK_SECRET', nil)
    return false if secret.blank?

    Razorpay::Utility.verify_webhook_signature(payload, request.headers['X-Razorpay-Signature'], secret)
  rescue SecurityError, JSON::ParserError
    false
  end
end
