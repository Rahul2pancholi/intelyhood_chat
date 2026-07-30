class CreateCaptainFaqTables < ActiveRecord::Migration[7.1]
  def change
    create_table :captain_faq_suggestions do |t|
      t.bigint :account_id, null: false
      t.bigint :assistant_id, null: false
      t.string :question, null: false
      t.text :answer, null: false
      t.string :language, null: false, default: 'en'
      t.integer :status, null: false, default: 0
      t.integer :source_count, null: false, default: 0
      t.vector :embedding, limit: 1536

      t.timestamps
    end
    add_index :captain_faq_suggestions, :account_id
    add_index :captain_faq_suggestions, :assistant_id
    add_index :captain_faq_suggestions, :embedding, using: :ivfflat, opclass: :vector_l2_ops,
                                                     name: 'vector_idx_captain_faq_suggestions_embedding'

    create_table :captain_faq_observations do |t|
      t.bigint :account_id, null: false
      t.bigint :conversation_id, null: false
      t.bigint :faq_suggestion_id
      t.string :generated_question, null: false
      t.text :generated_answer, null: false
      t.string :language, null: false, default: 'en'
      t.integer :status, null: false, default: 0

      t.timestamps
    end
    add_index :captain_faq_observations, :account_id
    add_index :captain_faq_observations, :conversation_id
    add_index :captain_faq_observations, :faq_suggestion_id
    add_foreign_key :captain_faq_observations, :captain_faq_suggestions, column: :faq_suggestion_id
  end
end
