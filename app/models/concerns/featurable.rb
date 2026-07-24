# rubocop:disable Metrics/ModuleLength
module Featurable
  extend ActiveSupport::Concern

  DEFAULT_FEATURE_FLAG_COLUMN = 'feature_flags'.freeze
  FEATURE_FLAG_COLUMNS = [DEFAULT_FEATURE_FLAG_COLUMN, 'feature_flags_ext_1'].freeze
  MAX_FEATURES_PER_COLUMN = 63

  QUERY_MODE = {
    flag_query_mode: :bit_operator,
    check_for_column: false
  }.freeze

  FEATURE_LIST = YAML.safe_load(Rails.root.join('config/features.yml').read).freeze
  # `intelychat_internal` premium features (e.g. search indexing pipelines) are
  # internal infra toggles, not customer-purchasable features, so they're
  # exempt from the plan-gating check in #feature_enabled? below.
  PREMIUM_FEATURE_NAMES = FEATURE_LIST.select { |feature| feature['premium'] && !feature['intelychat_internal'] }
                                      .pluck('name').to_set.freeze

  def self.feature_flag_mappings_for(feature_list)
    features_by_column = feature_list.group_by { |feature| feature['column'].presence || DEFAULT_FEATURE_FLAG_COLUMN }

    mappings = FEATURE_FLAG_COLUMNS.index_with do |column|
      features = features_by_column.delete(column) || []
      validate_feature_count!(column, features)

      features.each_with_index.to_h do |feature, index|
        [index + 1, "feature_#{feature['name']}".to_sym]
      end
    end

    validate_feature_columns!(features_by_column)
    mappings
  end

  def self.validate_feature_count!(column, features)
    return if features.size <= MAX_FEATURES_PER_COLUMN

    raise ArgumentError, "Account feature flag column #{column} supports up to #{MAX_FEATURES_PER_COLUMN} features"
  end

  def self.validate_feature_columns!(features_by_column)
    return if features_by_column.blank?

    invalid_columns = features_by_column.keys.join(', ')
    raise ArgumentError, "Unknown account feature flag column: #{invalid_columns}"
  end

  FEATURES_BY_COLUMN = feature_flag_mappings_for(FEATURE_LIST).freeze

  included do
    include FlagShihTzu

    FEATURE_FLAG_COLUMNS.each do |column|
      has_flags FEATURES_BY_COLUMN.fetch(column).merge(column: column).merge(QUERY_MODE)
    end

    before_create :enable_default_features

    define_method :all_feature_flags do
      FEATURE_FLAG_COLUMNS.flat_map { |column| all_flags(column) }
    end

    define_method :selected_feature_flags do
      FEATURE_FLAG_COLUMNS.flat_map { |column| selected_flags(column) }
    end

    define_method :selected_feature_flags= do |chosen_flags|
      FEATURE_FLAG_COLUMNS.each { |column| unselect_all_flags(column) }
      return if chosen_flags.nil?

      chosen_flags.each do |selected_flag|
        enable_flag(selected_flag.to_sym) if selected_flag.present?
      end
    end
  end

  def enable_features(*names)
    names.each do |name|
      send("feature_#{name}=", true)
    end
  end

  def enable_features!(*names)
    enable_features(*names)
    save
  end

  def disable_features(*names)
    names.each do |name|
      send("feature_#{name}=", false)
    end
  end

  def disable_features!(*names)
    disable_features(*names)
    save
  end

  # Premium features (config/features.yml `premium: true`) additionally require
  # the account to be on a plan that grants them, via an active/trialing
  # subscription — the per-account bitset flag alone is not sufficient. This
  # closes the gap where premium features were enabled by default for every
  # account regardless of payment status. Super Admins can still flip the
  # bitset off to force-disable a premium feature the plan would otherwise
  # grant, but cannot use it to grant a feature the plan doesn't include.
  def feature_enabled?(name)
    flag_enabled = send("feature_#{name}?")
    return flag_enabled unless flag_enabled && PREMIUM_FEATURE_NAMES.include?(name.to_s)

    premium_feature_permitted?(name)
  end

  # Reflects the raw per-account bitset (what Super Admin actually set), not the
  # plan-gated effective value — see feature_enabled? for the runtime check.
  def all_features
    FEATURE_LIST.pluck('name').index_with do |feature_name|
      send("feature_#{feature_name}?")
    end
  end

  def enabled_features
    all_features.select { |_feature, enabled| enabled == true }
  end

  # Plan-gated effective features — this (not enabled_features/all_features) is
  # what should be exposed to the frontend/API, since enabled_features reflects
  # only the raw bitset without the per-account plan permission check. Same
  # { name => true } shape as enabled_features (the frontend indexes into it
  # directly — see accounts.js#isFeatureEnabledonAccount).
  def effective_enabled_features
    FEATURE_LIST.pluck('name').index_with { true }.select { |feature_name, _| feature_enabled?(feature_name) }
  end

  def disabled_features
    all_features.select { |_feature, enabled| enabled == false }
  end

  private

  def premium_feature_permitted?(name)
    sub = subscription
    return false if sub.blank? || !sub.usable?

    sub.plan.present? && sub.plan.includes_feature?(name)
  end

  def enable_default_features
    config = InstallationConfig.find_by(name: 'ACCOUNT_LEVEL_FEATURE_DEFAULTS')
    return true if config.blank?

    features_to_enabled = config.value.select { |f| f[:enabled] }.pluck(:name)
    enable_features(*features_to_enabled)
  end
end
# rubocop:enable Metrics/ModuleLength
