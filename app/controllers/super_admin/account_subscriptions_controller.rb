class SuperAdmin::AccountSubscriptionsController < SuperAdmin::ApplicationController
  # An account can only have one subscription. If one already exists for the
  # selected account, update it instead of failing with a uniqueness error —
  # this is what an admin picking an account from the "New" form actually wants.
  def create
    existing = AccountSubscription.find_by(account_id: resource_params[:account_id])
    return super if existing.blank?

    if existing.update(resource_params.except(:account_id))
      redirect_to [namespace, existing], notice: translate_with_resource('update.success')
    else
      render :new, locals: {
        page: Administrate::Page::Form.new(dashboard, existing)
      }, status: :unprocessable_entity
    end
  end

  def scoped_resource
    resource_class.includes(:account, :plan)
  end
end
