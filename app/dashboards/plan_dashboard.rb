require 'administrate/base_dashboard'

class PlanDashboard < Administrate::BaseDashboard
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    name: Field::String,
    slug: Field::String,
    price_cents: Field::Number,
    currency: Field::String,
    billing_interval: Field::Select.with_options(collection: Plan::BILLING_INTERVALS),
    max_agents: Field::Number,
    max_inboxes: Field::Number,
    max_conversations_per_month: Field::Number,
    razorpay_plan_id: Field::String,
    included_features: PlanFeaturesField,
    active: Field::Boolean,
    position: Field::Number,
    account_subscriptions: Field::HasMany,
    created_at: Field::DateTime,
    updated_at: Field::DateTime
  }.freeze

  COLLECTION_ATTRIBUTES = %i[
    id
    name
    slug
    price_cents
    billing_interval
    active
  ].freeze

  SHOW_PAGE_ATTRIBUTES = %i[
    id
    name
    slug
    price_cents
    currency
    billing_interval
    max_agents
    max_inboxes
    max_conversations_per_month
    razorpay_plan_id
    included_features
    active
    position
    account_subscriptions
    created_at
    updated_at
  ].freeze

  FORM_ATTRIBUTES = %i[
    name
    slug
    price_cents
    currency
    billing_interval
    max_agents
    max_inboxes
    max_conversations_per_month
    razorpay_plan_id
    included_features
    active
    position
  ].freeze

  COLLECTION_FILTERS = {}.freeze

  def display_resource(plan)
    plan.name
  end
end
