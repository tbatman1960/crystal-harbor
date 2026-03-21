-- Refund Policies Table
CREATE TABLE IF NOT EXISTS refund_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status VARCHAR(50) NOT NULL UNIQUE, -- 'pending', 'ordered', 'in_production', 'shipped', etc.
    refund_percentage INTEGER NOT NULL DEFAULT 0, -- Percentage of order total refundable (0-100)
    conditions TEXT NOT NULL DEFAULT '', -- Human-readable conditions
    processing_fee_percentage INTEGER NOT NULL DEFAULT 0, -- Processing fee as percentage (0-100)
    restocking_fee_percentage INTEGER NOT NULL DEFAULT 0, -- Restocking fee as percentage (0-100)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund Requests Table
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    refund_type VARCHAR(50) NOT NULL CHECK (refund_type IN ('full', 'partial', 'customer_cancellation')),
    requested_amount DECIMAL(10,2) NOT NULL,
    processed_amount DECIMAL(10,2),
    refund_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'denied')),
    stripe_refund_id VARCHAR(255),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES admin_users(id)
);

-- Insert default refund policies
INSERT INTO refund_policies (status, refund_percentage, conditions, processing_fee_percentage, restocking_fee_percentage) VALUES
    ('pending', 100, 'Full refund available for orders not yet in production', 0, 0),
    ('ordered', 85, 'Partial refund available as order has been sent to production but not started', 5, 10),
    ('in_production', 50, 'Limited refund as items are currently being produced', 10, 15),
    ('quality_check', 25, 'Minimal refund as items are completed and being inspected', 15, 20),
    ('shipped', 0, 'No refund available once shipped. Returns may be accepted for defective items only', 0, 0),
    ('delivered', 0, 'No refund available. Returns may be accepted for defective items within 7 days', 0, 0),
    ('cancelled', 0, 'Order already cancelled', 0, 0)
ON CONFLICT (status) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Add RLS policies (if using Row Level Security)
-- ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
-- CREATE POLICY "Admin can manage refund policies" ON refund_policies FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users WHERE active = true));
-- CREATE POLICY "Admin can manage refund requests" ON refund_requests FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users WHERE active = true));

COMMENT ON TABLE refund_policies IS 'Configurable refund policies by order status';
COMMENT ON TABLE refund_requests IS 'Refund requests and processing history';