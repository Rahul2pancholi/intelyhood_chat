class SuperAdmin::PlatformBannersController < SuperAdmin::ApplicationController
  before_action :ensure_intelychat_cloud

  private

  def ensure_intelychat_cloud
    raise ActionController::RoutingError, 'Not Found' unless IntelychatApp.intelychat_cloud?
  end
end
