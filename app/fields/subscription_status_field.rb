require 'administrate/field/select'

class SubscriptionStatusField < Administrate::Field::Select
  def to_s
    data.to_s
  end

  def chip_classes
    case data.to_s
    when 'active'
      'subscription-status-chip subscription-status-chip--active'
    when 'trialing'
      'subscription-status-chip subscription-status-chip--trialing'
    when 'past_due'
      'subscription-status-chip subscription-status-chip--past-due'
    when 'canceled'
      'subscription-status-chip subscription-status-chip--canceled'
    else
      'subscription-status-chip'
    end
  end
end
