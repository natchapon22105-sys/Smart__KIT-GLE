USE kitgle_users;

CREATE TABLE IF NOT EXISTS family_messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  family_link_id  BIGINT UNSIGNED NOT NULL,
  sender_user_id  BIGINT UNSIGNED NOT NULL,
  body            VARCHAR(2000) NULL,
  image_data      MEDIUMTEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fm_link FOREIGN KEY (family_link_id) REFERENCES family_links(id) ON DELETE CASCADE,
  CONSTRAINT fk_fm_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_fm_link_id (family_link_id, id)
) ENGINE=InnoDB;
