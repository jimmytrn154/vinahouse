-- =========================================================
-- File: vinhousing_ddl.sql
-- Off-Campus Housing Management System (MySQL 8)
-- =========================================================

/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET TIME_ZONE='+00:00' */;

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS VinHousing;
CREATE DATABASE VinHousing CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE VinHousing;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1) USERS + SECURITY / AUDIT
-- =========================================================
CREATE TABLE users (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  phone           VARCHAR(30),
  role            VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT ck_users_role CHECK (role IN ('landlord','tenant','admin')),
  CONSTRAINT ck_users_status CHECK (status IN ('active','suspended','deleted'))
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id   BIGINT UNSIGNED NULL,
  action          VARCHAR(50) NOT NULL,              -- e.g., CREATE_LISTING, SIGN_CONTRACT, RESOLVE_ISSUE
  entity_type     VARCHAR(30) NOT NULL,              -- users/listings/contracts/issues/...
  entity_id       BIGINT UNSIGNED NOT NULL,
  metadata_json   JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor_time ON audit_logs(actor_user_id, created_at);

-- =========================================================
-- 2) ORG / AFFILIATION (University / Industrial Zone angle)
-- =========================================================
CREATE TABLE organizations (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  org_type    VARCHAR(30) NOT NULL,  -- university | industrial_park | company
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_org_type CHECK (org_type IN ('university','industrial_park','company'))
) ENGINE=InnoDB;

CREATE TABLE user_affiliations (
  user_id     BIGINT UNSIGNED NOT NULL,
  org_id      BIGINT UNSIGNED NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/verified/rejected
  verified_at DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, org_id),
  CONSTRAINT fk_aff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aff_org  FOREIGN KEY (org_id)  REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ck_aff_status CHECK (status IN ('pending','verified','rejected'))
) ENGINE=InnoDB;

CREATE INDEX idx_aff_org_status ON user_affiliations(org_id, status);

-- =========================================================
-- 3) PROPERTY / ROOM / LISTING
-- =========================================================
CREATE TABLE properties (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  org_id        BIGINT UNSIGNED NULL, -- link to uni/industrial zone if you want
  address       VARCHAR(400) NOT NULL,
  geo_lat       DECIMAL(10,7) NULL,
  geo_lng       DECIMAL(10,7) NULL,
  description   TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prop_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_prop_org   FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_properties_owner ON properties(owner_user_id);
CREATE INDEX idx_properties_org ON properties(org_id);

CREATE TABLE rooms (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  room_name   VARCHAR(100) NOT NULL,      -- e.g., "Room 101"
  capacity    INT NOT NULL DEFAULT 1,
  area_m2     DECIMAL(8,2) NULL,
  base_rent   DECIMAL(12,2) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT ck_room_capacity CHECK (capacity >= 1)
) ENGINE=InnoDB;

CREATE INDEX idx_rooms_property ON rooms(property_id);

CREATE TABLE listings (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,             -- landlord
  property_id   BIGINT UNSIGNED NULL,                 -- whole property listing
  room_id       BIGINT UNSIGNED NULL,                 -- room listing
  price         DECIMAL(12,2) NOT NULL,
  deposit       DECIMAL(12,2) NULL DEFAULT 0,
  available_from DATE NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending_verification',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_listing_owner    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_listing_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_room     FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  -- Exactly ONE of property_id or room_id must be NOT NULL:
  CONSTRAINT ck_listing_target CHECK ( (property_id IS NULL) <> (room_id IS NULL) ),

  CONSTRAINT ck_listing_status CHECK (status IN (
    'pending_verification','verified','rejected','available','reserved','rented','inactive'
  ))
) ENGINE=InnoDB;

CREATE INDEX idx_listing_status_available ON listings(status, available_from);
CREATE INDEX idx_listing_owner ON listings(owner_user_id);
CREATE INDEX idx_listing_property ON listings(property_id);
CREATE INDEX idx_listing_room ON listings(room_id);

CREATE TABLE listing_features (
  listing_id     BIGINT UNSIGNED PRIMARY KEY,
  features_json  JSON NOT NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_features_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 4) RENTAL REQUESTS -> CONTRACTS (+ tenants)
-- =========================================================
CREATE TABLE rental_requests (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  listing_id         BIGINT UNSIGNED NOT NULL,
  requester_user_id  BIGINT UNSIGNED NOT NULL,  -- tenant
  message            TEXT NULL,
  desired_move_in    DATE NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rr_listing   FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_requester FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT ck_rr_status CHECK (status IN ('pending','accepted','rejected','cancelled'))
) ENGINE=InnoDB;

CREATE INDEX idx_rr_listing_status ON rental_requests(listing_id, status);
CREATE INDEX idx_rr_requester_time ON rental_requests(requester_user_id, created_at);

CREATE TABLE contracts (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  listing_id       BIGINT UNSIGNED NOT NULL,
  landlord_user_id BIGINT UNSIGNED NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NULL,
  rent             DECIMAL(12,2) NOT NULL,
  deposit          DECIMAL(12,2) NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'draft',
  signed_at        DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contract_listing  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contract_landlord FOREIGN KEY (landlord_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT ck_contract_status CHECK (status IN ('draft','sent','signed','active','terminated','cancelled')),
  CONSTRAINT ck_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

CREATE INDEX idx_contract_listing ON contracts(listing_id);
CREATE INDEX idx_contract_landlord_status ON contracts(landlord_user_id, status);

CREATE TABLE contract_tenants (
  contract_id    BIGINT UNSIGNED NOT NULL,
  tenant_user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (contract_id, tenant_user_id),
  CONSTRAINT fk_ct_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_tenant   FOREIGN KEY (tenant_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE contract_signatures (
  contract_id      BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,
  signed_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature_method VARCHAR(30) NOT NULL DEFAULT 'checkbox', -- checkbox/otp/digital/...
  PRIMARY KEY (contract_id, user_id),
  CONSTRAINT fk_cs_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE house_rules (
  property_id  BIGINT UNSIGNED PRIMARY KEY,
  rules_text   TEXT NOT NULL,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rules_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rule_ack (
  contract_id     BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  acknowledged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contract_id, user_id),
  CONSTRAINT fk_ack_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ack_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 5) ISSUES (case management) + attachments + history
-- =========================================================
CREATE TABLE issue_reports (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  contract_id      BIGINT UNSIGNED NOT NULL,
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  assignee_user_id BIGINT UNSIGNED NULL, -- usually admin
  category         VARCHAR(30) NOT NULL,
  severity         VARCHAR(10) NOT NULL DEFAULT 'medium',
  description      TEXT NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'open',
  sla_hours        INT NOT NULL DEFAULT 24,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at      DATETIME NULL,

  CONSTRAINT fk_issue_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issue_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT ck_issue_category CHECK (category IN ('maintenance','scam','safety','noise','hygiene','contract_dispute','other')),
  CONSTRAINT ck_issue_severity CHECK (severity IN ('low','medium','high','critical')),
  CONSTRAINT ck_issue_status CHECK (status IN ())
) ENGINE=InnoDB;

CREATE INDEX idx_issue_contract_status ON issue_reports(contract_id, status);
CREATE INDEX idx_issue_status_time ON issue_reports(status, created_at);

CREATE TABLE issue_attachments (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  issue_id     BIGINT UNSIGNED NOT NULL,
  file_url     VARCHAR(1000) NOT NULL,
  uploaded_by  BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attach_issue FOREIGN KEY (issue_id) REFERENCES issue_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_user  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_attach_issue ON issue_attachments(issue_id);

CREATE TABLE issue_status_history (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  issue_id    BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(20) NOT NULL,
  to_status   VARCHAR(20) NOT NULL,
  changed_by  BIGINT UNSIGNED NOT NULL,
  changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_issue FOREIGN KEY (issue_id) REFERENCES issue_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_user  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_hist_issue_time ON issue_status_history(issue_id, changed_at);

-- =========================================================
-- 6) REVIEWS (gated by contract in app logic)
-- =========================================================
CREATE TABLE reviews (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  contract_id      BIGINT UNSIGNED NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NOT NULL,
  target_type      VARCHAR(20) NOT NULL DEFAULT 'listing', -- listing/landlord/property/room
  target_id        BIGINT UNSIGNED NOT NULL,               -- polymorphic (cannot FK cleanly)
  rating           TINYINT UNSIGNED NOT NULL,
  comment          TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_review_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user     FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_review_target CHECK (target_type IN ('listing','landlord','property','room')),
  CONSTRAINT uq_review_unique UNIQUE (contract_id, reviewer_user_id, target_type, target_id)
) ENGINE=InnoDB;

CREATE INDEX idx_review_target ON reviews(target_type, target_id);

-- =========================================================
-- 7) VERIFICATIONS (admin verification workflow)
-- =========================================================
CREATE TABLE verifications (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  verifier_user_id BIGINT UNSIGNED NOT NULL,             -- admin
  target_type      VARCHAR(20) NOT NULL,                 -- landlord/property/listing
  target_id        BIGINT UNSIGNED NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes            TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_verifier FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT ck_verif_target CHECK (target_type IN ('landlord','property','listing')),
  CONSTRAINT ck_verif_status CHECK (status IN ('pending','verified','rejected'))
) ENGINE=InnoDB;

CREATE INDEX idx_verif_target ON verifications(target_type, target_id);
CREATE INDEX idx_verif_status_time ON verifications(status, created_at);

-- =========================================================
-- 8) SMART MATCHING (lightweight)
-- =========================================================
CREATE TABLE user_preferences (
  user_id         BIGINT UNSIGNED PRIMARY KEY,
  budget_min      DECIMAL(12,2) NULL,
  budget_max      DECIMAL(12,2) NULL,
  move_in         DATE NULL,
  commute_max_km  DECIMAL(6,2) NULL,
  tags_json       JSON NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_pref_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
) ENGINE=InnoDB;

-- =========================================================
-- 9) ANTI-SCAM / MODERATION
-- =========================================================
CREATE TABLE flags (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  flagger_user_id BIGINT UNSIGNED NOT NULL,
  target_type     VARCHAR(20) NOT NULL,         -- listing/user/property/issue
  target_id       BIGINT UNSIGNED NOT NULL,
  reason          VARCHAR(255) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_flagger FOREIGN KEY (flagger_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT ck_flag_target CHECK (target_type IN ('listing','user','property','issue'))
) ENGINE=InnoDB;

CREATE INDEX idx_flags_target ON flags(target_type, target_id);

CREATE TABLE user_strikes (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  points      INT NOT NULL,
  reason      VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_strike_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_strike_points CHECK (points <> 0)
) ENGINE=InnoDB;

CREATE INDEX idx_strikes_user_time ON user_strikes(user_id, created_at);

-- End of file
