namespace :billing do
  desc 'Seed the default billing plans'
  task seed_plans: :environment do
    [
      { name: 'Free', slug: 'free', price_cents: 0, max_agents: 2, max_inboxes: 1, max_conversations_per_month: 200, position: 0 },
      { name: 'Starter', slug: 'starter', price_cents: 1900, max_agents: 5, max_inboxes: 3, max_conversations_per_month: 2000, position: 1 },
      { name: 'Pro', slug: 'pro', price_cents: 4900, max_agents: 15, max_inboxes: 10, max_conversations_per_month: 10_000, position: 2 },
      { name: 'Enterprise', slug: 'enterprise', price_cents: 0, max_agents: nil, max_inboxes: nil, max_conversations_per_month: nil, position: 3 }
    ].each do |attrs|
      plan = Plan.find_or_initialize_by(slug: attrs[:slug])
      plan.update!(attrs)
      puts "Seeded plan: #{plan.name}"
    end
  end
end
