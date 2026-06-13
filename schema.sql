-- =============================================================
-- iron_platform — Full MySQL Schema
-- Generated from Smart-iron + Smart-iron-admin analysis
-- =============================================================

CREATE DATABASE IF NOT EXISTS iron_platform
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE iron_platform;

-- ──────────────────────────────────────────
-- 1. USERS
--    Covers: customers, vendors, delivery agents, admins
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  phone           VARCHAR(15)   NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  DEFAULT NULL,          -- NULL for customers (OTP-only)
  role            ENUM('customer','vendor','delivery','admin') NOT NULL DEFAULT 'customer',
  address         TEXT          DEFAULT NULL,
  zone            VARCHAR(100)  DEFAULT NULL,
  rating          DECIMAL(3,2)  DEFAULT 0.00,
  status          ENUM('active','inactive','on_leave') DEFAULT 'active',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone  (phone),
  INDEX idx_role   (role),
  INDEX idx_zone   (zone)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 2. GARMENTS  (price catalogue)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS garments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(10)  DEFAULT NULL,             -- emoji icon stored for frontend use
  category    ENUM('Tops','Bottoms','Ethnic','Formal','Outerwear','Linen') NOT NULL,
  price       DECIMAL(8,2) NOT NULL,
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 3. ORDERS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  order_code          VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. ORD-001
  customer_id         INT          NOT NULL,
  vendor_id           INT          DEFAULT NULL,      -- assigned after vendor accepts
  delivery_agent_id   INT          DEFAULT NULL,      -- assigned by admin
  slot                VARCHAR(60)  DEFAULT NULL,      -- e.g. "9:00 AM – 11:00 AM"
  pickup_date         DATE         DEFAULT NULL,
  total               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status              ENUM(
                        'pending',
                        'vendor_accepted',
                        'picked_up',
                        'in_progress',
                        'out_for_delivery',
                        'delivered',
                        'cancelled'
                      ) NOT NULL DEFAULT 'pending',
  payment_method      ENUM('cash_on_delivery','online') DEFAULT 'cash_on_delivery',
  notes               TEXT         DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)       REFERENCES users(id),
  FOREIGN KEY (vendor_id)         REFERENCES users(id),
  FOREIGN KEY (delivery_agent_id) REFERENCES users(id),
  INDEX idx_customer  (customer_id),
  INDEX idx_vendor    (vendor_id),
  INDEX idx_agent     (delivery_agent_id),
  INDEX idx_status    (status),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 4. ORDER ITEMS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT          NOT NULL,
  garment_id      INT          NOT NULL,
  garment_name    VARCHAR(100) NOT NULL,             -- denormalised for history safety
  quantity        INT          NOT NULL DEFAULT 1,
  unit_price      DECIMAL(8,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (garment_id) REFERENCES garments(id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 5. ORDER STATUS HISTORY  (full audit trail)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  status      ENUM(
                'pending',
                'vendor_accepted',
                'picked_up',
                'in_progress',
                'out_for_delivery',
                'delivered',
                'cancelled'
              ) NOT NULL,
  changed_by  INT          DEFAULT NULL,
  note        TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 6. DELIVERY ASSIGNMENTS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  order_id            INT NOT NULL UNIQUE,
  delivery_agent_id   INT NOT NULL,
  assigned_by         INT NOT NULL,                  -- admin user id
  pickup_at           TIMESTAMP    DEFAULT NULL,
  delivered_at        TIMESTAMP    DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)          REFERENCES orders(id),
  FOREIGN KEY (delivery_agent_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by)       REFERENCES users(id),
  INDEX idx_agent (delivery_agent_id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 7. VENDOR CAPACITY
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_capacity (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id         INT NOT NULL,
  category          ENUM('Tops','Bottoms','Ethnic','Formal','Outerwear','Linen') NOT NULL,
  current_capacity  INT DEFAULT 0,
  max_capacity      INT NOT NULL DEFAULT 20,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  UNIQUE KEY uk_vendor_cat (vendor_id, category)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 8. STAFF  (workers at vendor shops)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id   INT          NOT NULL,
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(100) NOT NULL,                 -- e.g. Head Presser, Sorter
  shift       ENUM('Morning','Afternoon','Evening')  NOT NULL,
  status      ENUM('active','on_leave')              DEFAULT 'active',
  joined_year YEAR         DEFAULT NULL,
  phone       VARCHAR(15)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  INDEX idx_vendor (vendor_id)
) ENGINE=InnoDB;

-- ──────────────────────────────────────────
-- 9. PRICING  (admin-configurable)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  garment_id    INT  NOT NULL UNIQUE,
  price         DECIMAL(8,2) NOT NULL,
  price_category ENUM('Regular','Special','Premium') NOT NULL DEFAULT 'Regular',
  updated_by    INT  DEFAULT NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (garment_id)  REFERENCES garments(id),
  FOREIGN KEY (updated_by)  REFERENCES users(id)
) ENGINE=InnoDB;

-- =============================================================
-- SEED DATA
-- =============================================================

-- Seed garments (matches Smart-iron CATALOGUE exactly)
INSERT INTO garments (name, icon, category, price) VALUES
  ('Shirt',      '👔', 'Tops',      15.00),
  ('T-Shirt',    '👕', 'Tops',      12.00),
  ('Dress',      '👗', 'Tops',      30.00),
  ('Trousers',   '👖', 'Bottoms',   20.00),
  ('Saree',      '🥻', 'Ethnic',    50.00),
  ('Kurta',      '👘', 'Ethnic',    18.00),
  ('Suit (2pc)', '🤵', 'Formal',    80.00),
  ('Jacket',     '🧥', 'Outerwear', 35.00),
  ('Bed Sheet',  '🛏',  'Linen',    40.00),
  ('Towel',      '🧺', 'Linen',     10.00);

-- Seed pricing (mirrors garment prices initially)
INSERT INTO pricing (garment_id, price, price_category)
  SELECT id, price,
    CASE
      WHEN category IN ('Tops','Bottoms','Linen') THEN 'Regular'
      WHEN category IN ('Ethnic')                 THEN 'Special'
      ELSE 'Premium'
    END
  FROM garments;

-- Seed staff users (admin app demo credentials — password = bcrypt of shown value)
-- Passwords are inserted as plain bcrypt hashes; backend registers them properly.
-- Using placeholder hashes here; the STEP 4 seed script will INSERT with real hashes.
INSERT INTO users (name, phone, role, zone, status) VALUES
  ('Admin User',    '9000000000', 'admin',    'All Zones',    'active'),
  ('Murugan Irons', '9876543210', 'vendor',   'Koramangala',  'active'),
  ('Ravi Kumar',    '9123456789', 'delivery', 'Indiranagar',  'active');

-- Seed vendor capacity rows (one per category for the vendor)
INSERT INTO vendor_capacity (vendor_id, category, current_capacity, max_capacity)
SELECT u.id, c.category, 0,
  CASE c.category
    WHEN 'Tops'      THEN 25
    WHEN 'Bottoms'   THEN 20
    WHEN 'Ethnic'    THEN 15
    WHEN 'Formal'    THEN 5
    WHEN 'Outerwear' THEN 8
    WHEN 'Linen'     THEN 12
  END
FROM users u
CROSS JOIN (
  SELECT 'Tops'      AS category UNION ALL
  SELECT 'Bottoms'               UNION ALL
  SELECT 'Ethnic'                UNION ALL
  SELECT 'Formal'                UNION ALL
  SELECT 'Outerwear'             UNION ALL
  SELECT 'Linen'
) c
WHERE u.role = 'vendor';
