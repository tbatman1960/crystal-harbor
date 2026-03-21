-- Create site_settings table for SEO admin panel if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, key)
);

-- Insert default SEO settings
INSERT INTO site_settings (category, key, value) VALUES 
    ('seo', 'homepage_title', 'Crystal Harbor Trading Co. — Custom Printed T-Shirts, Blankets, Banners & Flags'),
    ('seo', 'homepage_description', 'Upload your design, choose your product, and we''ll handle the rest. Quality custom printing with no minimums. Volume pricing available.'),
    ('seo', 'homepage_keywords', 'custom printing, t-shirts, banners, flags, blankets, personalized products, volume pricing, no minimum orders'),
    ('seo', 'homepage_og_image', '/icons/icon-192x192.png'),
    ('seo', 'default_og_image', '/icons/icon-192x192.png'),
    ('seo', 'organization_name', 'Crystal Harbor Trading Company'),
    ('seo', 'organization_logo', '/icons/icon-192x192.png'),
    ('seo', 'organization_contact_phone', '+1-555-CRYSTAL'),
    ('seo', 'organization_address', 'United States'),
    ('seo', 'social_facebook', ''),
    ('seo', 'social_twitter', ''),
    ('seo', 'social_instagram', '')
ON CONFLICT (category, key) DO NOTHING;