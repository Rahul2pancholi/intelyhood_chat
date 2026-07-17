class DeviseOverrides::OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
  include EmailHelper

  def omniauth_success
    get_resource_from_auth_hash
    return redirect_to_login_with_oauth_error if auth_hash.blank?

    @resource.present? ? sign_in_user : sign_up_user
  rescue StandardError => e
    Rails.logger.error("[OAUTH] omniauth_success failed: #{e.class}: #{e.message}")
    redirect_to_login_with_oauth_error
  end

  def omniauth_failure
    Rails.logger.error("[OAUTH] omniauth_failure: #{params[:message]}")
    redirect_to_login_with_oauth_error
  end

  private

  def redirect_to_login_with_oauth_error
    redirect_to login_page_url(error: 'omniauth-failed'), allow_other_host: true
  end

  def sign_in_user
    # Capture before skip_confirmation! sets confirmed_at, which would
    # make oauth_user_needs_password_reset? return false and skip the
    # password reset for persisted unconfirmed users.
    needs_password_reset = oauth_user_needs_password_reset?
    @resource.skip_confirmation! if confirmable_enabled?
    set_random_password_if_oauth_user if needs_password_reset

    # once the resource is found and verified
    # we can just send them to the login page again with the SSO params
    # that will log them in
    encoded_email = ERB::Util.url_encode(@resource.email)
    redirect_to login_page_url(email: encoded_email, sso_auth_token: @resource.generate_sso_auth_token),
                allow_other_host: true
  end

  def sign_in_user_on_mobile
    # See comment in sign_in_user for why this is captured before skip_confirmation!
    needs_password_reset = oauth_user_needs_password_reset?
    @resource.skip_confirmation! if confirmable_enabled?
    set_random_password_if_oauth_user if needs_password_reset

    # once the resource is found and verified
    # we can just send them to the login page again with the SSO params
    # that will log them in
    encoded_email = ERB::Util.url_encode(@resource.email)
    params = { email: encoded_email, sso_auth_token: @resource.generate_sso_auth_token }.to_query

    mobile_deep_link_base = GlobalConfigService.load('MOBILE_DEEP_LINK_BASE', 'intelychatapp')
    redirect_to "#{mobile_deep_link_base}://auth/saml?#{params}", allow_other_host: true
  end

  def sign_up_user
    return redirect_to login_page_url(error: 'no-account-found'), allow_other_host: true unless account_signup_allowed?

    unless validate_signup_email_is_business_domain?
      return redirect_to login_page_url(error: 'business-account-only'),
                         allow_other_host: true
    end

    create_account_for_user
    set_random_password_if_oauth_user
    token = @resource.send(:set_reset_password_token)
    redirect_to "#{frontend_base_url}/app/auth/password/edit?config=default&reset_password_token=#{token}",
                allow_other_host: true
  end

  def login_page_url(error: nil, email: nil, sso_auth_token: nil)
    params = { email: email, sso_auth_token: sso_auth_token }.compact
    params[:error] = error if error.present?

    "#{frontend_base_url}/app/login?#{params.to_query}"
  end

  # Prefer the host that handled the OAuth callback so local/dev redirects stay on
  # the same origin even if FRONTEND_URL still points at a tunnel/remote URL.
  def frontend_base_url
    request.base_url.presence || ENV.fetch('FRONTEND_URL', nil)
  end

  def account_signup_allowed?
    GlobalConfigService.account_signup_enabled?
  end

  def resource_class(_mapping = nil)
    User
  end

  def get_resource_from_auth_hash # rubocop:disable Naming/AccessorMethodName
    return if auth_hash.blank?

    email = auth_hash.dig('info', 'email')
    @resource = resource_class.from_email(email)
  end

  def validate_signup_email_is_business_domain?
    # return true if the user is a business account, false if it is a blocked domain account
    Account::SignUpEmailValidationService.new(auth_hash['info']['email']).perform
  rescue CustomExceptions::Account::InvalidEmail
    false
  end

  def create_account_for_user
    @resource, @account = AccountBuilder.new(
      account_name: extract_domain_without_tld(auth_hash['info']['email']),
      user_full_name: auth_hash['info']['name'],
      email: auth_hash['info']['email'],
      locale: I18n.locale,
      confirmed: auth_hash['info']['email_verified']
    ).perform
    Avatar::AvatarFromUrlJob.perform_later(@resource, auth_hash['info']['image'])
  end

  def oauth_user_needs_password_reset?
    @resource.present? && (@resource.new_record? || !@resource.confirmed?)
  end

  def set_random_password_if_oauth_user
    # Password must satisfy secure_password requirements (uppercase, lowercase, number, special char)
    @resource.update(password: "#{SecureRandom.hex(16)}aA1!") if @resource.persisted?
  end

  def default_devise_mapping
    'user'
  end
end

DeviseOverrides::OmniauthCallbacksController.prepend_mod_with('DeviseOverrides::OmniauthCallbacksController')
