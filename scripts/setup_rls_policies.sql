-- ============================================
-- SUPABASE RLS POLICIES FOR AFSONA APP
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ORDERS TABLE POLICIES
-- ============================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Couriers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

-- Policy: Customers can view their own orders
CREATE POLICY "Customers can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Policy: Couriers can view orders assigned to them OR orders with 'tayyor' status
CREATE POLICY "Couriers can view available orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() = courier_id 
    OR (courier_id IS NULL AND status = 'tayyor')
    OR status IN ('tayyor', 'olib_ketildi')
  );

-- Policy: Couriers can update orders assigned to them
CREATE POLICY "Couriers can update assigned orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = courier_id OR status = 'tayyor')
  WITH CHECK (
    auth.uid() = courier_id 
    OR (auth.uid() = courier_id AND status IN ('olib_ketildi', 'yetkazildi'))
  );

-- Policy: Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- ============================================
-- 2. COURIER_LOCATIONS TABLE POLICIES
-- ============================================

-- Enable RLS on courier_locations table
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Couriers can manage their own locations" ON courier_locations;
DROP POLICY IF EXISTS "Customers can view courier locations for their orders" ON courier_locations;

-- Policy: Couriers can manage their own locations
CREATE POLICY "Couriers can manage their own locations"
  ON courier_locations
  FOR ALL
  USING (auth.uid() = courier_id)
  WITH CHECK (auth.uid() = courier_id);

-- Policy: Customers can view courier locations for their orders
CREATE POLICY "Customers can view courier locations for their orders"
  ON courier_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = courier_locations.order_id 
      AND orders.customer_id = auth.uid()
    )
  );

-- ============================================
-- 3. ENABLE REALTIME FOR TABLES
-- ============================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE courier_locations;

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

-- Index for orders by status (for couriers)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Index for orders by courier_id
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);

-- Index for orders by customer_id
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Index for courier_locations by order_id
CREATE INDEX IF NOT EXISTS idx_courier_locations_order_id ON courier_locations(order_id);

-- Index for courier_locations by courier_id
CREATE INDEX IF NOT EXISTS idx_courier_locations_courier_id ON courier_locations(courier_id);

-- ============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for courier_locations table
DROP TRIGGER IF EXISTS update_courier_locations_updated_at ON courier_locations;
CREATE TRIGGER update_courier_locations_updated_at
  BEFORE UPDATE ON courier_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ORDER STATUS CHECK CONSTRAINT
-- ============================================

-- Add check constraint for valid status values
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS valid_status_check;

ALTER TABLE orders
ADD CONSTRAINT valid_status_check 
CHECK (status IN (
  'yangi',
  'qabul_qilindi', 
  'tayyorlanmoqda',
  'tayyor',
  'olib_ketildi',
  'yetkazildi',
  'bekor_qilindi'
));

-- ============================================
-- VERIFICATION QUERIES (run to check setup)
-- ============================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('orders', 'courier_locations');

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('orders', 'courier_locations');
