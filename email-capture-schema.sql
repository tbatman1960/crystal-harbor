-- Email capture system database schema
-- Create subscriber_emails table

CREATE TABLE IF NOT EXISTS subscriber_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('footer', 'popup', 'checkout')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    discount_code_sent BOOLEAN DEFAULT false,
    discount_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriber_emails_email ON subscriber_emails(email);

-- Create index on source for analytics
CREATE INDEX IF NOT EXISTS idx_subscriber_emails_source ON subscriber_emails(source);

-- Create index on subscribed_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_subscriber_emails_subscribed_at ON subscriber_emails(subscribed_at);

-- Add discount_codes table for tracking discount usage
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    value NUMERIC(5,2) NOT NULL, -- e.g., 10.00 for 10%
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_discount_amount NUMERIC(10,2),
    usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    subscriber_email_id UUID REFERENCES subscriber_emails(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on discount code for fast lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

-- Update email capture settings in site_settings table
INSERT INTO site_settings (category, key, value) VALUES 
    ('email_capture', 'popup_enabled', 'true'),
    ('email_capture', 'popup_delay_seconds', '30'),
    ('email_capture', 'popup_exit_intent', 'true'),
    ('email_capture', 'discount_percentage', '10'),
    ('email_capture', 'discount_code_prefix', 'WELCOME')
ON CONFLICT (category, key) DO NOTHING;