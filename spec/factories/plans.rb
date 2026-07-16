# frozen_string_literal: true

FactoryBot.define do
  factory :plan do
    sequence(:name) { |n| "Plan #{n}" }
    sequence(:slug) { |n| "plan-#{n}" }
    price_cents { 0 }
    currency { 'usd' }
    billing_interval { 'month' }
    active { true }
    included_features { [] }
  end
end
