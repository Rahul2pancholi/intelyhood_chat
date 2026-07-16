class Api::V1::Accounts::BillingController < Api::V1::Accounts::BaseController
  before_action :check_authorization

  def show
    @subscription = Current.account.subscription
    @plans = Plan.active
  end

  def checkout_session
    plan = Plan.active.find(params[:plan_id])
    razorpay_subscription = Billing::CheckoutSessionService.new(account: Current.account, plan: plan).perform
    render json: { url: razorpay_subscription.short_url }
  end

  def portal_session
    razorpay_subscription = Billing::PortalSessionService.new(account: Current.account).perform
    render json: { url: razorpay_subscription.short_url }
  end

  private

  def check_authorization
    authorize(Current.account, :update?)
  end
end
