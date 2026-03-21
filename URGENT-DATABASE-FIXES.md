# 🚨 URGENT Database Fixes Required

## 🔍 Issues Identified:

### ❌ **Issue 1: Missing `tax_amount` column in `orders` table**
**Error:** `Could not find the 'tax_amount' column of 'orders' in the schema cache`
**Impact:** Order creation fails completely

### ❌ **Issue 2: Missing `shipping_methods` table**
**Error:** `Could not find the table 'public.shipping_methods' in the schema cache`
**Impact:** Admin shipping method management fails

---

## 🛠️ **IMMEDIATE FIX REQUIRED**

### **Step 1: Add Missing Column to Orders Table**

Go to your **Supabase Dashboard** and run this SQL:

```sql
-- Add tax_amount column to orders table
ALTER TABLE orders 
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
```

### **Step 2: Create Shipping Methods Table**

Run this SQL in your **Supabase Dashboard**:

```sql
-- Create shipping_methods table
CREATE TABLE shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('flat_rate', 'weight_based', 'calculated')),
    flat_rate_cost DECIMAL(10,2),
    weight_tiers JSONB,
    carrier_code VARCHAR(50),
    service_code VARCHAR(50),
    min_order_for_free_shipping DECIMAL(10,2),
    estimated_days_min INTEGER DEFAULT 5,
    estimated_days_max INTEGER DEFAULT 7,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default shipping methods
INSERT INTO shipping_methods (name, description, method_type, flat_rate_cost, estimated_days_min, estimated_days_max) VALUES
('Standard Shipping', 'Regular ground shipping', 'flat_rate', 9.99, 5, 7),
('Express Shipping', 'Expedited 2-3 day delivery', 'flat_rate', 19.99, 2, 3),
('Free Shipping', 'Free shipping on orders over $75', 'flat_rate', 0.00, 7, 10);
```

---

## 🎯 **How to Apply These Fixes:**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Open your Crystal Harbor project
3. Click "SQL Editor" in the left sidebar
4. Copy and paste the SQL from Step 1
5. Click "RUN"
6. Copy and paste the SQL from Step 2
7. Click "RUN"

### **Option 2: Database URL (if you have direct access)**
```bash
# If you have psql access to your database
psql "your-supabase-connection-string" -c "ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;"
```

---

## ✅ **After Applying Fixes:**

### **Test Order Creation:**
1. Go to http://localhost:3000/checkout
2. Add items to cart
3. Fill out shipping form
4. Click "Skip Payment (Test Order)"
5. Should create order successfully

### **Test Shipping Methods:**
1. Go to http://localhost:3000/admin/shipping
2. Click "Add Shipping Method"
3. Fill out form and save
4. Should save successfully

---

## 🚨 **Priority Level: CRITICAL**

These are **blocking issues** that prevent core functionality:
- ❌ **Order creation completely broken**
- ❌ **Admin shipping management broken**
- ✅ **Site loads and runs normally otherwise**

**Estimated fix time:** 2-3 minutes in Supabase dashboard

---

## 📞 **If You Need Help:**

1. **Supabase Dashboard:** https://supabase.com/dashboard
2. **SQL Editor:** Left sidebar → SQL Editor
3. **Run SQL:** Copy, paste, click "RUN"
4. **Verify:** Check Tables tab to see new table and column

**Once these are fixed, both order creation and shipping method management will work perfectly!** 🎯