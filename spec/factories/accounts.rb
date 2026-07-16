# frozen_string_literal: true

FactoryBot.define do
  factory :account do
    sequence(:name) { |n| "Account #{n}" }
    status { 'active' }
    domain { 'test.com' }
    support_email { 'support@test.com' }

    after(:create) do |account|
      enterprise_plan = Plan.find_by(slug: 'enterprise')
      account.subscription&.update!(plan: enterprise_plan) if enterprise_plan
    end
  end
end
