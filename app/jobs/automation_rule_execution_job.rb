class AutomationRuleExecutionJob < ApplicationJob
  queue_as :low

  def perform(rule, user)
    account = rule.account
    matched_count = 0

    account.conversations.find_each do |conversation|
      conditions_match = AutomationRules::ConditionsFilterService.new(rule, conversation).perform
      next unless conditions_match

      AutomationRules::ActionService.new(rule, account, conversation).perform
      matched_count += 1
    end

    AdministratorNotifications::AccountNotificationMailer.with(account: account)
                                                          .automation_rule_run_complete(rule, matched_count, user.email)
                                                          &.deliver_later
  ensure
    rule.mark_run_complete!
  end
end
