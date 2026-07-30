class Internal::CheckNewVersionsJob < ApplicationJob
  queue_as :scheduled_jobs

  def perform
    # Disabled: this used to phone home to an external hosted hub for version/plan
    # sync, which has no relationship to this installation's own billing and was
    # resetting the installation plan (and disabling paid features) to "community"
    # every run. Re-enable once our own hub/licensing service is in place.
    nil
  end

  private

  def update_version_info
    return if @instance_info['version'].blank?

    ::Redis::Alfred.set(::Redis::Alfred::LATEST_INTELYCHAT_VERSION, @instance_info['version'])
  end
end

Internal::CheckNewVersionsJob.prepend_mod_with('Internal::CheckNewVersionsJob')
