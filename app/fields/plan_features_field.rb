require 'administrate/field/base'

class PlanFeaturesField < Administrate::Field::Base
  def self.permitted_attribute(attr, _options = {})
    { attr => [] }
  end

  # Only plan-gated premium features are relevant here — see
  # Featurable::PREMIUM_FEATURE_NAMES (excludes intelychat_internal ones).
  def selectable_features
    Featurable::PREMIUM_FEATURE_NAMES.to_a.sort
  end

  def display_name_for(feature_name)
    Featurable::FEATURE_LIST.find { |f| f['name'] == feature_name }&.fetch('display_name', feature_name) || feature_name
  end

  def to_s
    Array(data).join(', ').presence || '—'
  end
end
