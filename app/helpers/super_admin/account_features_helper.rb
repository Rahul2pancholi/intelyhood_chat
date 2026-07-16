module SuperAdmin::AccountFeaturesHelper
  # Channel features are split for easy filtering in Super Admin UI.
  CHANNEL_GROUPS = {
    whatsapp: {
      label: 'WhatsApp',
      description: 'WhatsApp messaging and campaigns',
      icon: 'icon-whatsapp-line',
      features: %w[whatsapp_campaign whatsapp_manual_transfer]
    },
    live_chat: {
      label: 'Live Chat',
      description: 'Website live chat widget',
      icon: 'icon-chat-smile-3-line',
      features: %w[channel_website]
    },
    email: {
      label: 'Email',
      description: 'Email channel and continuity',
      icon: 'icon-mail-send-fill',
      features: %w[
        channel_email inbound_emails email_continuity_on_api_channel
        custom_reply_email custom_reply_domain
      ]
    },
    social: {
      label: 'Social',
      description: 'Facebook, Instagram and TikTok',
      icon: 'icon-messenger-line',
      features: %w[channel_facebook channel_instagram channel_tiktok]
    },
    voice: {
      label: 'Voice',
      description: 'Voice calling channel',
      icon: 'icon-voice-line',
      features: %w[channel_voice]
    }
  }.freeze

  FEATURE_CATEGORIES = {
    channels: {
      label: 'Channels',
      description: 'Inbox and messaging channels',
      features: CHANNEL_GROUPS.values.flat_map { |group| group[:features] }
    },
    product: {
      label: 'Product',
      description: 'Core product capabilities',
      features: %w[
        help_center inbox_management labels custom_attributes canned_responses macros
        automations agent_bots campaigns reports report_rollup crm companies
        auto_resolve_conversations ip_lookup voice_recorder intelychat_v4 advanced_search
        data_import csat_review_notes conversation_required_attributes
      ]
    },
    team: {
      label: 'Team & Ops',
      description: 'Agents, teams and assignment',
      features: %w[
        agent_management team_management assignment_v2 advanced_assignment custom_roles
      ]
    },
    ai: {
      label: 'AI & Captain',
      description: 'Captain AI and related features',
      features: %w[
        captain_integration captain_integration_v2 captain_tasks captain_document_auto_sync
        custom_tools
      ]
    },
    integrations: {
      label: 'Integrations',
      description: 'Third-party integrations',
      features: %w[
        integrations linear_integration notion_integration crm_integration
      ]
    },
    security: {
      label: 'Security & Branding',
      description: 'Auth, audit and branding',
      features: %w[
        saml audit_logs disable_branding sla
      ]
    }
  }.freeze

  FEATURE_ICONS = {
    'channel_website' => 'icon-chat-smile-3-line',
    'channel_email' => 'icon-mail-send-fill',
    'channel_facebook' => 'icon-messenger-line',
    'channel_instagram' => 'icon-instagram',
    'channel_tiktok' => 'icon-tiktok',
    'channel_voice' => 'icon-voice-line',
    'inbound_emails' => 'icon-mail-send-fill',
    'email_continuity_on_api_channel' => 'icon-mail-send-fill',
    'custom_reply_email' => 'icon-mail-send-fill',
    'custom_reply_domain' => 'icon-mail-send-fill',
    'whatsapp_campaign' => 'icon-whatsapp-line',
    'whatsapp_manual_transfer' => 'icon-whatsapp-line',
    'help_center' => 'icon-book-2-line',
    'inbox_management' => 'icon-folder-3-line',
    'labels' => 'icon-draft-line',
    'custom_attributes' => 'icon-apps-2-line',
    'canned_responses' => 'icon-reply-line',
    'macros' => 'icon-reply-line',
    'automations' => 'icon-robot-line',
    'agent_bots' => 'icon-robot-line',
    'campaigns' => 'icon-megaphone-line',
    'reports' => 'icon-dashboard-line',
    'report_rollup' => 'icon-dashboard-line',
    'crm' => 'icon-user-follow-line',
    'companies' => 'icon-building-4-line',
    'auto_resolve_conversations' => 'icon-tick-line',
    'ip_lookup' => 'icon-menu-search-line',
    'voice_recorder' => 'icon-voice-line',
    'intelychat_v4' => 'icon-grid-line',
    'advanced_search' => 'icon-menu-search-line',
    'data_import' => 'icon-folder-3-line',
    'csat_review_notes' => 'icon-draft-line',
    'conversation_required_attributes' => 'icon-apps-2-line',
    'agent_management' => 'icon-user-follow-line',
    'team_management' => 'icon-user-follow-line',
    'assignment_v2' => 'icon-mist-fill',
    'advanced_assignment' => 'icon-mist-fill',
    'custom_roles' => 'icon-lock-line',
    'captain_integration' => 'icon-captain',
    'captain_integration_v2' => 'icon-captain',
    'captain_tasks' => 'icon-captain',
    'captain_document_auto_sync' => 'icon-captain',
    'custom_tools' => 'icon-captain',
    'integrations' => 'icon-apps-2-line',
    'linear_integration' => 'icon-linear',
    'notion_integration' => 'icon-notion',
    'crm_integration' => 'icon-apps-2-line',
    'saml' => 'icon-lock-line',
    'audit_logs' => 'icon-menu-search-line',
    'disable_branding' => 'icon-sailbot-fill',
    'sla' => 'icon-hourglass-line'
  }.freeze

  def self.account_features
    YAML.safe_load(Rails.root.join('config/features.yml').read).freeze
  end

  def self.account_premium_features
    account_features.filter { |feature| feature['premium'] }.pluck('name')
  end

  def self.feature_display_names
    account_features.each_with_object({}) do |feature, hash|
      hash[feature['name']] = feature['display_name']
    end
  end

  def self.feature_icon(feature_key)
    FEATURE_ICONS[feature_key.to_s] || 'icon-apps-2-line'
  end

  def self.feature_category_for(feature_key)
    FEATURE_CATEGORIES.each do |category_key, meta|
      return category_key if meta[:features].include?(feature_key.to_s)
    end

    :other
  end

  def self.channel_group_for(feature_key)
    CHANNEL_GROUPS.each do |group_key, meta|
      return group_key if meta[:features].include?(feature_key.to_s)
    end

    nil
  end

  def self.filter_internal_features(features)
    return features if IntelychatApp.intelychat_cloud?

    internal_features = account_features.select { |f| f['intelychat_internal'] }.pluck('name')
    features.except(*internal_features)
  end

  def self.filter_deprecated_features(features)
    deprecated_features = account_features.select { |f| f['deprecated'] }.pluck('name')
    features.except(*deprecated_features)
  end

  def self.sort_and_transform_features(features, display_names)
    features.sort_by { |key, _| display_names[key] || key }
            .to_h
            .transform_keys { |key| [key, display_names[key]] }
  end

  def self.partition_features(features)
    filtered = filter_internal_features(features)
    filtered = filter_deprecated_features(filtered)
    display_names = feature_display_names

    regular, premium = filtered.partition { |key, _value| account_premium_features.exclude?(key) }

    [
      sort_and_transform_features(regular, display_names),
      sort_and_transform_features(premium, display_names)
    ]
  end

  def self.filtered_features(features)
    regular, premium = partition_features(features)
    regular.merge(premium)
  end

  def self.build_channel_subgroups(channel_features)
    CHANNEL_GROUPS.filter_map do |group_key, meta|
      items = channel_features.select { |key_array, _| meta[:features].include?(key_array.first) }
      next if items.blank?

      {
        key: group_key,
        label: meta[:label],
        description: meta[:description],
        icon: meta[:icon],
        features: items
      }
    end
  end

  # Returns [{ key:, label:, description:, features:, subgroups: [] }]
  def self.grouped_features(features)
    transformed = filtered_features(features)
    buckets = FEATURE_CATEGORIES.keys.index_with { |_key| {} }
    buckets[:other] = {}

    transformed.each do |key_array, enabled|
      feature_key = key_array.first
      category = feature_category_for(feature_key)
      buckets[category][key_array] = enabled
    end

    (FEATURE_CATEGORIES.keys + [:other]).filter_map do |category_key|
      items = buckets[category_key]
      next if items.blank?

      meta = if category_key == :other
               { label: 'Other', description: 'Additional features' }
             else
               FEATURE_CATEGORIES[category_key]
             end

      group = {
        key: category_key,
        label: meta[:label],
        description: meta[:description],
        features: items,
        subgroups: []
      }

      group[:subgroups] = build_channel_subgroups(items) if category_key == :channels
      group
    end
  end
end
