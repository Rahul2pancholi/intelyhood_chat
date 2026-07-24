class SeedDefaultPlans < ActiveRecord::Migration[7.1]
  # Plan rows must exist in every environment (not just dev/demo data) since
  # Account#assign_default_subscription looks up the 'free' plan for every
  # newly created account — see app/models/account.rb.
  PRO_FEATURES = %w[disable_branding custom_roles advanced_assignment companies csat_review_notes
                    conversation_required_attributes].freeze
  ENTERPRISE_FEATURES = (PRO_FEATURES + %w[audit_logs custom_tools sla captain_integration channel_voice
                                           captain_integration_v2 captain_document_auto_sync advanced_search saml]).freeze

  PLANS = [
    { slug: 'free', name: 'Free', price_cents: 0, max_agents: 2, max_inboxes: 1,
      max_conversations_per_month: 200, position: 0, included_features: [] },
    { slug: 'pro', name: 'Pro', price_cents: 4900, max_agents: 10, max_inboxes: 5,
      max_conversations_per_month: 2000, position: 1, included_features: PRO_FEATURES },
    { slug: 'enterprise', name: 'Enterprise', price_cents: 19_900, max_agents: nil, max_inboxes: nil,
      max_conversations_per_month: nil, position: 2, included_features: ENTERPRISE_FEATURES }
  ].freeze

  def up
    PLANS.each do |attrs|
      plan = Plan.find_or_initialize_by(slug: attrs[:slug])
      plan.assign_attributes(attrs.merge(currency: 'usd', billing_interval: 'month', active: true))
      plan.save!
    end
  end

  def down
    slugs = PLANS.pluck(:slug)
    Plan.where(slug: slugs).destroy_all
  end
end
