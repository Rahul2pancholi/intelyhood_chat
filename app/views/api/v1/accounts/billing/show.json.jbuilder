json.subscription do
  if @subscription
    json.status @subscription.status
    json.seats @subscription.seats
    json.current_period_end @subscription.current_period_end
    json.plan do
      if @subscription.plan
        json.id @subscription.plan.id
        json.name @subscription.plan.name
        json.slug @subscription.plan.slug
        json.max_agents @subscription.plan.max_agents
        json.max_inboxes @subscription.plan.max_inboxes
        json.max_conversations_per_month @subscription.plan.max_conversations_per_month
      end
    end
  end
end

json.usage do
  json.agents Current.account.users.count
  json.inboxes Current.account.inboxes.count
end

json.plans @plans do |plan|
  json.id plan.id
  json.name plan.name
  json.slug plan.slug
  json.price plan.price
  json.currency plan.currency
  json.billing_interval plan.billing_interval
  json.max_agents plan.max_agents
  json.max_inboxes plan.max_inboxes
  json.max_conversations_per_month plan.max_conversations_per_month
end
