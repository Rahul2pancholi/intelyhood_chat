class RenameChatwootRecordColumns < ActiveRecord::Migration[7.1]
  def change
    rename_column :data_import_items, :chatwoot_record_type, :intelychat_record_type
    rename_column :data_import_items, :chatwoot_record_id, :intelychat_record_id
    rename_column :data_import_mappings, :chatwoot_record_type, :intelychat_record_type
    rename_column :data_import_mappings, :chatwoot_record_id, :intelychat_record_id

    rename_index :data_import_items, 'idx_data_import_items_on_record', 'idx_data_import_items_on_intelychat_record'
    rename_index :data_import_mappings, 'idx_data_import_mappings_on_record', 'idx_data_import_mappings_on_intelychat_record'
  end
end
