class RenameChatwootInstallationConfigKeys < ActiveRecord::Migration[7.1]
  RENAMES = {
    'CHATWOOT_CLOUD_PLANS' => 'INTELYCHAT_CLOUD_PLANS',
    'CHATWOOT_INBOX_HMAC_KEY' => 'INTELYCHAT_INBOX_HMAC_KEY',
    'CHATWOOT_INBOX_TOKEN' => 'INTELYCHAT_INBOX_TOKEN',
    'CHATWOOT_INSTANCE_ADMIN_EMAIL' => 'INTELYCHAT_INSTANCE_ADMIN_EMAIL',
    'CHATWOOT_SUPPORT_IDENTIFIER_HASH' => 'INTELYCHAT_SUPPORT_IDENTIFIER_HASH',
    'CHATWOOT_SUPPORT_SCRIPT_URL' => 'INTELYCHAT_SUPPORT_SCRIPT_URL',
    'CHATWOOT_SUPPORT_WEBSITE_TOKEN' => 'INTELYCHAT_SUPPORT_WEBSITE_TOKEN'
  }.freeze

  def up
    RENAMES.each do |old_name, new_name|
      execute "UPDATE installation_configs SET name = #{quote(new_name)} WHERE name = #{quote(old_name)}"
    end
  end

  def down
    RENAMES.each do |old_name, new_name|
      execute "UPDATE installation_configs SET name = #{quote(old_name)} WHERE name = #{quote(new_name)}"
    end
  end
end
