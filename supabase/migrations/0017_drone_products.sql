-- drone_products — consumer / enterprise / defense drone product catalog
CREATE TABLE IF NOT EXISTS drone_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  manufacturer text NOT NULL,
  -- top-level: consumer, photography, fpv-racing, fpv-freestyle, cinewhoop,
  -- long-range, enterprise, agricultural, delivery, military, public-safety, vtol
  category text NOT NULL,
  subcategory text,

  image_url text,          -- hero image
  gallery jsonb DEFAULT '[]'::jsonb,

  price_usd_min numeric,
  price_usd_max numeric,
  release_year int,
  country_of_origin text,

  specs jsonb DEFAULT '{}'::jsonb,
  -- recommended keys: weight_g, flight_time_min, max_speed_kmh, max_range_km,
  -- max_altitude_m, camera_sensor, gimbal, video_resolution, obstacle_sensing,
  -- transmission, payload_kg, wingspan_mm, wheelbase_mm

  description text,
  features jsonb DEFAULT '[]'::jsonb,   -- array of strings
  highlights jsonb DEFAULT '[]'::jsonb, -- array of key bullets

  official_url text,
  purchase_links jsonb DEFAULT '[]'::jsonb,
  -- purchase_links: [{store: 'Amazon', url: '...', price_usd: 999}, ...]

  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'published',
  featured boolean DEFAULT false,

  views int DEFAULT 0,
  likes int DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drone_products_category ON drone_products(category);
CREATE INDEX IF NOT EXISTS idx_drone_products_manufacturer ON drone_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_drone_products_status ON drone_products(status);
CREATE INDEX IF NOT EXISTS idx_drone_products_slug ON drone_products(slug);

ALTER TABLE drone_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drone_products anon read" ON drone_products;
CREATE POLICY "drone_products anon read" ON drone_products FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "drone_products admin all" ON drone_products;
CREATE POLICY "drone_products admin all" ON drone_products USING (
  auth.role() = 'service_role'
);

-- Comment
COMMENT ON TABLE drone_products IS 'Catalog of drone products displayed on the /gear page. Powers card grid + detail pages.';
