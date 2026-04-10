-- Migration: Add customization support to order_items table
-- Purpose: Store DesignSpecification JSON data for customized products
-- Date: 2026-04-10

-- Add customization_data JSONB column to store design specifications
ALTER TABLE order_items 
ADD COLUMN customization_data JSONB DEFAULT NULL;

-- Add customization_fee column for tracking fees separately
ALTER TABLE order_items 
ADD COLUMN customization_fee NUMERIC(10,2) DEFAULT 0.00;

-- Create index on customization_data for faster queries
CREATE INDEX idx_order_items_customization_data 
ON order_items USING GIN (customization_data);

-- Add comment for documentation
COMMENT ON COLUMN order_items.customization_data IS 'JSON data containing the full DesignSpecification from the customization module';
COMMENT ON COLUMN order_items.customization_fee IS 'Fee charged for customization services (stored separately from unit_price)';

-- Example customization_data structure:
-- {
--   "designId": "uuid-v4",
--   "productId": "uuid-of-product", 
--   "selectedColor": "Navy",
--   "selectedSize": "XL",
--   "layers": [...],
--   "fees": {...},
--   "previewImageUrl": "data:image/png;base64,...",
--   "metadata": {...}
-- }