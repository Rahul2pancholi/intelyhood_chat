module SuperAdmin::AccountFeaturesHelper
  include SuperAdmin::AccountFeaturesData

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
    buckets = bucket_features_by_category(transformed)

    (FEATURE_CATEGORIES.keys + [:other]).filter_map do |category_key|
      build_category_group(category_key, buckets[category_key])
    end
  end

  def self.bucket_features_by_category(transformed_features)
    buckets = FEATURE_CATEGORIES.keys.index_with { |_key| {} }
    buckets[:other] = {}

    transformed_features.each do |key_array, enabled|
      category = feature_category_for(key_array.first)
      buckets[category][key_array] = enabled
    end

    buckets
  end

  def self.build_category_group(category_key, items)
    return if items.blank?

    meta = category_key == :other ? { label: 'Other', description: 'Additional features' } : FEATURE_CATEGORIES[category_key]

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
