require 'administrate/base_dashboard'

class AccountSubscriptionDashboard < Administrate::BaseDashboard
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    account: Field::BelongsTo.with_options(searchable: true, searchable_field: 'name', order: 'id DESC'),
    plan: PlanChipField,
    status: SubscriptionStatusField.with_options(collection: AccountSubscription::STATUSES),
    razorpay_customer_id: Field::String,
    razorpay_subscription_id: Field::String,
    razorpay_short_url: Field::String,
    current_period_end: Field::DateTime,
    seats: Field::Number,
    created_at: Field::DateTime,
    updated_at: Field::DateTime
  }.freeze

  COLLECTION_ATTRIBUTES = %i[
    id
    account
    plan
    status
    seats
    current_period_end
  ].freeze

  SHOW_PAGE_ATTRIBUTES = %i[
    id
    account
    plan
    status
    razorpay_customer_id
    razorpay_subscription_id
    razorpay_short_url
    current_period_end
    seats
    created_at
    updated_at
  ].freeze

  FORM_ATTRIBUTES = %i[
    account
    plan
    status
    seats
    current_period_end
  ].freeze

  COLLECTION_FILTERS = {
    trialing: ->(resources) { resources.where(status: 'trialing') },
    active: ->(resources) { resources.where(status: 'active') },
    past_due: ->(resources) { resources.where(status: 'past_due') },
    canceled: ->(resources) { resources.where(status: 'canceled') }
  }.freeze

  def display_resource(account_subscription)
    "##{account_subscription.id} #{account_subscription.account&.name}"
  end
end
