-- Migration: Add Shipping Labels Table
-- Date: 2026-04-19
-- Description: Stores USPS shipping label data per order/package

CREATE TABLE shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  package_index INTEGER NOT NULL DEFAULT 0,
  package_name VARCHAR(100),
  tracking_number VARCHAR(100),
  carrier VARCHAR(50) DEFAULT 'usps',
  service_name VARCHAR(100),
  label_data TEXT, -- base64 encoded PDF
  label_format VARCHAR(10) DEFAULT 'PDF',
  cost NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'created', -- created, voided, used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_labels_order ON shipping_labels(order_id);
CREATE INDEX idx_shipping_labels_tracking ON shipping_labels(tracking_number);
CREATE INDEX idx_shipping_labels_status ON shipping_labels(status);
