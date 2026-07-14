require 'administrate/base_dashboard'

class AccountSubscriptionDashboard < Administrate::BaseDashboard
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    account: Field::BelongsTo.with_options(searchable: true, searchable_field: 'name', order: 'id DESC'),
    plan: Field::BelongsTo,
    status: Field::Select.with_options(collection: AccountSubscription::STATUSES),
    stripe_customer_id: Field::String,
    stripe_subscription_id: Field::String,
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
  ].freeze

  SHOW_PAGE_ATTRIBUTES = %i[
    id
    account
    plan
    status
    stripe_customer_id
    stripe_subscription_id
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

  COLLECTION_FILTERS = {}.freeze

  def display_resource(account_subscription)
    "##{account_subscription.id} #{account_subscription.account&.name}"
  end
end
