# frozen_string_literal: true

require 'agents'

Rails.application.config.after_initialize do
  api_key = InstallationConfig.find_by(name: 'CAPTAIN_OPEN_AI_API_KEY')&.value
  model = InstallationConfig.find_by(name: 'CAPTAIN_OPEN_AI_MODEL')&.value.presence || LlmConstants::DEFAULT_MODEL
  api_endpoint = InstallationConfig.find_by(name: 'CAPTAIN_OPEN_AI_ENDPOINT')&.value || LlmConstants::OPENAI_API_ENDPOINT
  gemini_api_key = InstallationConfig.find_by(name: 'CAPTAIN_GEMINI_API_KEY')&.value

  if api_key.present? || gemini_api_key.present?
    Agents.configure do |config|
      if api_key.present?
        config.openai_api_key = api_key
        if api_endpoint.present?
          api_base = "#{api_endpoint.chomp('/')}/v1"
          config.openai_api_base = api_base
        end
      end
      config.gemini_api_key = gemini_api_key if gemini_api_key.present?
      config.default_model = model
      config.debug = false
    end
  end
rescue StandardError => e
  Rails.logger.error "Failed to configure AI Agents SDK: #{e.message}"
end
