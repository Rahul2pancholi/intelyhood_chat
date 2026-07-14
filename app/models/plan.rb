# == Schema Information
#
# Table name: plans
#
#  id                          :bigint           not null, primary key
#  active                      :boolean          default(TRUE), not null
#  billing_interval            :string           default("month"), not null
#  currency                    :string           default("usd"), not null
#  max_agents                  :integer
#  max_conversations_per_month :integer
#  max_inboxes                 :integer
#  name                        :string           not null
#  position                    :integer          default(0), not null
#  price_cents                 :integer          default(0), not null
#  slug                        :string           not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  stripe_price_id             :string
#
# Indexes
#
#  index_plans_on_slug  (slug) UNIQUE
#
class Plan < ApplicationRecord
  BILLING_INTERVALS = %w[month year].freeze

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :billing_interval, inclusion: { in: BILLING_INTERVALS }

  has_many :account_subscriptions, dependent: :nullify

  default_scope { order(:position) }
  scope :active, -> { where(active: true) }

  def price
    price_cents / 100.0
  end
end
