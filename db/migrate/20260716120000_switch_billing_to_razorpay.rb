class SwitchBillingToRazorpay < ActiveRecord::Migration[7.1]
  def change
    rename_column :account_subscriptions, :stripe_customer_id, :razorpay_customer_id
    rename_column :account_subscriptions, :stripe_subscription_id, :razorpay_subscription_id
    add_column :account_subscriptions, :razorpay_short_url, :string

    rename_column :plans, :stripe_price_id, :razorpay_plan_id

    # Premium feature names (see config/features.yml `premium: true`) granted by
    # this plan on top of the always-available features — see Featurable#feature_enabled?.
    add_column :plans, :included_features, :jsonb, null: false, default: []
  end
end
