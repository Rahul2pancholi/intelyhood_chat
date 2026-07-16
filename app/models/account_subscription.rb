# == Schema Information
#
# Table name: account_subscriptions
#
#  id                       :bigint           not null, primary key
#  current_period_end       :datetime
#  razorpay_short_url       :string
#  seats                    :integer          default(1), not null
#  status                   :string           default("trialing"), not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  account_id               :bigint           not null
#  plan_id                  :bigint
#  razorpay_customer_id     :string
#  razorpay_subscription_id :string
#
# Indexes
#
#  index_account_subscriptions_on_account_id  (account_id) UNIQUE
#  index_account_subscriptions_on_plan_id     (plan_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (plan_id => plans.id)
#
class AccountSubscription < ApplicationRecord
  STATUSES = %w[trialing active past_due canceled].freeze

  belongs_to :account
  belongs_to :plan, optional: true

  validates :account_id, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  def within_agent_limit?
    limit = plan&.max_agents
    return true if limit.blank?

    account.users.count < limit
  end

  def within_inbox_limit?
    limit = plan&.max_inboxes
    return true if limit.blank?

    account.inboxes.count < limit
  end

  # A subscription still grants access to its plan's paid features while trialing
  # or active; past_due/canceled do not (see Featurable#feature_enabled?).
  def usable?
    %w[trialing active].include?(status)
  end
end
