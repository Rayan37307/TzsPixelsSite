CREATE TABLE IF NOT EXISTS fraud_checks (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  order_number VARCHAR(50),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  billing_country VARCHAR(50),
  shipping_country VARCHAR(50),
  shipping_address TEXT,
  amount DECIMAL(10,2) NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level VARCHAR(10) NOT NULL DEFAULT 'safe',
  red_flags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'pending',
  scanned_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_status ON fraud_checks(status);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_risk_level ON fraud_checks(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_scanned_at ON fraud_checks(scanned_at);