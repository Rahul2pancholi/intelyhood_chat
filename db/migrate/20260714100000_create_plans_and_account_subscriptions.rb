class CreatePlansAndAccountSubscriptions < ActiveRecord::Migration[7.1]
  def change
    create_table :plans do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.integer :price_cents, null: false, default: 0
      t.string :currency, null: false, default: 'usd'
      t.string :billing_interval, null: false, default: 'month'
      t.integer :max_agents
      t.integer :max_inboxes
      t.integer :max_conversations_per_month
      t.string :stripe_price_id
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0

      t.timestamps
    end
    add_index :plans, :slug, unique: true

    create_table :account_subscriptions do |t|
      t.references :account, null: false, foreign_key: true, index: { unique: true }
      t.references :plan, foreign_key: true
      t.string :status, null: false, default: 'trialing'
      t.string :stripe_customer_id
      t.string :stripe_subscription_id
      t.datetime :current_period_end
      t.integer :seats, null: false, default: 1

      t.timestamps
    end
  end
end
