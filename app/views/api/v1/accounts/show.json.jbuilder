json.partial! 'api/v1/models/account', formats: [:json], resource: @account
json.latest_intelychat_version @latest_intelychat_version
json.partial! 'enterprise/api/v1/accounts/partials/account', account: @account if IntelychatApp.enterprise?
