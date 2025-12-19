-- Create table for storing proposed end dates by each party
CREATE TABLE IF NOT EXISTS contract_proposed_end_dates (
  contract_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  proposed_end_date DATE NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (contract_id, user_id),
  CONSTRAINT fk_cped_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cped_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_cped_contract ON contract_proposed_end_dates(contract_id);

