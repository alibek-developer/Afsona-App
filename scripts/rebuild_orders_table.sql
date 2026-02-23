-- Orders table rebuild with proper schema
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  delivery_address text, -- Optional - location detection may fail
  latitude float8, -- Optional - location detection may fail
  longitude float8, -- Optional - location detection may fail
  total_amount numeric NOT NULL,
  items jsonb NOT NULL,
  type text NOT NULL DEFAULT 'delivery', -- Payment method type
  status text DEFAULT 'yangi'
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON orders FOR INSERT WITH CHECK (true);

-- Schema cache refresh to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';
