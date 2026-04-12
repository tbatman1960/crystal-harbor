-- Migration: Add Design Sharing Tables
-- Date: 2026-04-12
-- Description: Creates tables for sharing designs and collecting feedback

-- Shared designs table
CREATE TABLE shared_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL, -- References customer_designs.id
  customer_id UUID, -- References customers.id (nullable for guest designs)
  share_token VARCHAR(32) UNIQUE NOT NULL, -- Unique sharing token for URL
  title VARCHAR(255), -- Optional title for the shared design
  description TEXT, -- Optional description
  design_data JSONB, -- Store the complete design specification for sharing
  allow_feedback BOOLEAN DEFAULT false, -- Whether to show feedback form
  click_count INTEGER DEFAULT 0, -- Track how many times the link was viewed
  converted_orders INTEGER DEFAULT 0, -- Count of orders placed using this shared design
  expires_at TIMESTAMPTZ, -- Optional expiration date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design comments/feedback table
CREATE TABLE design_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_design_id UUID NOT NULL REFERENCES shared_designs(id) ON DELETE CASCADE,
  commenter_name VARCHAR(100) NOT NULL, -- Name provided by commenter
  commenter_email VARCHAR(255), -- Optional email for notifications
  comment_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true, -- For moderation if needed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share analytics table (optional - for detailed tracking)
CREATE TABLE design_share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_design_id UUID NOT NULL REFERENCES shared_designs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'click_cta', 'order_placed', 'comment_added'
  visitor_ip INET, -- For basic analytics
  user_agent TEXT, -- Browser/device info
  referrer_url TEXT, -- Where they came from
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shared_designs_token ON shared_designs(share_token);
CREATE INDEX idx_shared_designs_customer ON shared_designs(customer_id);
CREATE INDEX idx_shared_designs_expires ON shared_designs(expires_at);
CREATE INDEX idx_shared_designs_created ON shared_designs(created_at);
CREATE INDEX idx_design_comments_shared_design ON design_comments(shared_design_id);
CREATE INDEX idx_design_comments_created ON design_comments(created_at);
CREATE INDEX idx_share_analytics_shared_design ON design_share_analytics(shared_design_id);
CREATE INDEX idx_share_analytics_event_created ON design_share_analytics(event_type, created_at);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_shared_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_shared_designs_updated_at
  BEFORE UPDATE ON shared_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_designs_updated_at();

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(32) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  token TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..32 LOOP
    token := token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN token;
END;
$$ language 'plpgsql';

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_share_click(token VARCHAR(32))
RETURNS VOID AS $$
BEGIN
  UPDATE shared_designs 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE share_token = token;
  
  -- Also log the analytics event
  INSERT INTO design_share_analytics (shared_design_id, event_type)
  SELECT id, 'view'
  FROM shared_designs
  WHERE share_token = token;
END;
$$ language 'plpgsql';

-- Comments for documentation
COMMENT ON TABLE shared_designs IS 'Shareable links for customer designs with analytics';
COMMENT ON COLUMN shared_designs.share_token IS 'Unique 32-character token for public sharing URL';
COMMENT ON COLUMN shared_designs.allow_feedback IS 'Whether to show comment form on shared page';
COMMENT ON TABLE design_comments IS 'Comments/feedback left on shared designs';
COMMENT ON TABLE design_share_analytics IS 'Detailed analytics for shared design interactions';