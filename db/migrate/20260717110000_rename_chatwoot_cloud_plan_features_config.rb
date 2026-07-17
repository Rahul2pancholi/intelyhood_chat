class RenameChatwootCloudPlanFeaturesConfig < ActiveRecord::Migration[7.1]
  def up
    execute "UPDATE installation_configs SET name = 'INTELYCHAT_CLOUD_PLAN_FEATURES' WHERE name = 'CHATWOOT_CLOUD_PLAN_FEATURES'"
  end

  def down
    execute "UPDATE installation_configs SET name = 'CHATWOOT_CLOUD_PLAN_FEATURES' WHERE name = 'INTELYCHAT_CLOUD_PLAN_FEATURES'"
  end
end
