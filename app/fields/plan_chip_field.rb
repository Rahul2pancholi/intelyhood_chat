require 'administrate/field/belongs_to'

class PlanChipField < Administrate::Field::BelongsTo
  def to_s
    data&.name || '—'
  end

  def chip_label
    data&.name || 'No plan'
  end

  def chip_classes
    return 'plan-chip plan-chip--empty' if data.blank?

    "plan-chip plan-chip--#{data.slug.to_s.parameterize}"
  end
end
