-- Migration: Add Design Templates Table
-- Date: 2026-04-12
-- Description: Creates tables for pre-made design templates that customers can use as starting points

-- Design Templates table
CREATE TABLE design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'birthday', 'team-spirit', 'business', 'memorial', 'holiday', etc.
  description TEXT,
  thumbnail_url TEXT, -- URL to preview image
  layer_data JSONB NOT NULL, -- DesignSpecification format layers array
  product_types TEXT[] DEFAULT '{}', -- Array of product types this template applies to, empty means all
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) -- Admin who created it
);

-- Template categories lookup (optional - for organizing templates)
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL, -- 'birthday-celebration', 'team-spirit', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50), -- Icon identifier for UI
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO template_categories (slug, name, description, icon_name, display_order) VALUES
  ('birthday', 'Birthday Celebration', 'Festive designs for birthday celebrations', 'cake', 1),
  ('team-spirit', 'Team Spirit', 'Sports and team-related layouts', 'trophy', 2),
  ('business', 'Business Logo', 'Clean, professional designs for businesses', 'building', 3),
  ('memorial', 'Memorial/Tribute', 'Respectful designs for memorials and tributes', 'heart', 4),
  ('holiday', 'Holiday', 'Seasonal and holiday-themed designs', 'gift', 5);

-- Indexes for performance
CREATE INDEX idx_design_templates_category ON design_templates(category);
CREATE INDEX idx_design_templates_active ON design_templates(is_active);
CREATE INDEX idx_design_templates_display_order ON design_templates(display_order);
CREATE INDEX idx_template_categories_active ON template_categories(is_active);
CREATE INDEX idx_template_categories_slug ON template_categories(slug);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_design_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_design_templates_updated_at();

-- Comments for documentation
COMMENT ON TABLE design_templates IS 'Pre-made design templates that customers can use as starting points';
COMMENT ON COLUMN design_templates.layer_data IS 'JSON array of design layers in DesignSpecification format';
COMMENT ON COLUMN design_templates.product_types IS 'Array of product types this template applies to. Empty array means available for all products';
COMMENT ON TABLE template_categories IS 'Categories for organizing design templates';