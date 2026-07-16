# == Schema Information
#
# Table name: data_import_mappings
#
#  id                     :bigint           not null, primary key
#  intelychat_record_type :string           not null
#  metadata               :jsonb            not null
#  source_object_type     :string           not null
#  source_provider        :string           not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  account_id             :integer          not null
#  data_import_id         :bigint           not null
#  intelychat_record_id   :bigint           not null
#  source_object_id       :string           not null
#
# Indexes
#
#  idx_data_import_mappings_on_account_and_source  (account_id,source_provider,source_object_type,source_object_id) UNIQUE
#  idx_data_import_mappings_on_intelychat_record   (intelychat_record_type,intelychat_record_id)
#  index_data_import_mappings_on_data_import_id    (data_import_id)
#
class DataImportMapping < ApplicationRecord
  belongs_to :data_import
  belongs_to :account

  validates :source_provider, :source_object_type, :source_object_id, :intelychat_record_type, :intelychat_record_id, presence: true
  validates :source_object_id, uniqueness: { scope: [:account_id, :source_provider, :source_object_type] }

  def intelychat_record
    intelychat_record_type.constantize.find_by(id: intelychat_record_id)
  end
end
