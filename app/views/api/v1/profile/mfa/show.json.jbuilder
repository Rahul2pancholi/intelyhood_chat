json.feature_available Intelychat.mfa_enabled?
json.enabled @user.mfa_enabled?
json.backup_codes_generated @user.mfa_service.backup_codes_generated? if Intelychat.mfa_enabled?
