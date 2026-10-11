-- ProFolio / MVP schema proposal (NOT APPLIED).
-- Run ONLY in a dedicated ProFolio Supabase project after review.
-- Never execute this migration in Central GO or GTstudio.
-- Designed for Supabase Auth + private Storage; public demo is unchanged.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profolio_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 120),
  company_name text CHECK (char_length(company_name) <= 180),
  contact_email text CHECK (char_length(contact_email) <= 254),
  contact_phone text CHECK (char_length(contact_phone) <= 40),
  is_contact_public boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.profolio_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profolio_profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.profolio_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profolio_is_admin() TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profolio_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profolio_profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 8 AND 180),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
  operation text NOT NULL CHECK (operation IN ('sale', 'rent')),
  property_type text NOT NULL CHECK (property_type IN ('house', 'apartment', 'land', 'commercial', 'other')),
  price numeric(15,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CLP', 'MXN')),
  address text CHECK (char_length(address) <= 250),
  city text NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 120),
  region text CHECK (char_length(region) <= 120),
  country text NOT NULL DEFAULT 'US' CHECK (char_length(country) = 2),
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  bedrooms numeric(4,1) CHECK (bedrooms >= 0),
  bathrooms numeric(4,1) CHECK (bathrooms >= 0),
  area_m2 numeric(12,2) CHECK (area_m2 >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profolio_coordinates_pair CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE TABLE IF NOT EXISTS public.profolio_listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.profolio_listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE CHECK (char_length(storage_path) BETWEEN 1 AND 500),
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 50),
  caption text CHECK (char_length(caption) <= 250),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Private leads; submissions must go through a verified server endpoint.
-- No anonymous INSERT grants or public INSERT RLS policies.
CREATE TABLE IF NOT EXISTS public.profolio_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.profolio_listings(id) ON DELETE RESTRICT,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 150),
  email text CHECK (char_length(email) <= 254),
  phone text CHECK (char_length(phone) <= 40),
  message text CHECK (char_length(message) <= 2500),
  consent_given boolean NOT NULL CHECK (consent_given),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profolio_lead_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Server-recorded events only; do not mistake browser demo clicks for analytics.
CREATE TABLE IF NOT EXISTS public.profolio_listing_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.profolio_listings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('detail_view', 'contact_click', 'lead_created')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profolio_listings_public_idx
  ON public.profolio_listings(status, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS profolio_listings_agent_idx
  ON public.profolio_listings(agent_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS profolio_photos_listing_idx
  ON public.profolio_listing_photos(listing_id, position);
CREATE INDEX IF NOT EXISTS profolio_leads_listing_idx
  ON public.profolio_leads(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profolio_events_listing_idx
  ON public.profolio_listing_events(listing_id, event_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.profolio_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profolio_profiles_updated_at ON public.profolio_profiles;
CREATE TRIGGER profolio_profiles_updated_at BEFORE UPDATE ON public.profolio_profiles
FOR EACH ROW EXECUTE FUNCTION public.profolio_touch_updated_at();
DROP TRIGGER IF EXISTS profolio_listings_updated_at ON public.profolio_listings;
CREATE TRIGGER profolio_listings_updated_at BEFORE UPDATE ON public.profolio_listings
FOR EACH ROW EXECUTE FUNCTION public.profolio_touch_updated_at();

ALTER TABLE public.profolio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profolio_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profolio_listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profolio_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profolio_listing_events ENABLE ROW LEVEL SECURITY;

-- Explicit column grants prevent a user from editing role or moderation_status.
REVOKE ALL ON public.profolio_profiles FROM anon, authenticated;
REVOKE ALL ON public.profolio_listings FROM anon, authenticated;
REVOKE ALL ON public.profolio_listing_photos FROM anon, authenticated;
REVOKE ALL ON public.profolio_leads FROM anon, authenticated;
REVOKE ALL ON public.profolio_listing_events FROM anon, authenticated;
GRANT SELECT ON public.profolio_profiles TO anon, authenticated;
GRANT INSERT (id,display_name,company_name,contact_email,contact_phone,is_contact_public)
  ON public.profolio_profiles TO authenticated;
GRANT UPDATE (display_name,company_name,contact_email,contact_phone,is_contact_public)
  ON public.profolio_profiles TO authenticated;
GRANT SELECT ON public.profolio_listings TO anon, authenticated;
GRANT INSERT (agent_id,title,description,operation,property_type,price,currency,address,city,region,country,latitude,longitude,bedrooms,bathrooms,area_m2,status)
  ON public.profolio_listings TO authenticated;
GRANT UPDATE (title,description,operation,property_type,price,currency,address,city,region,country,latitude,longitude,bedrooms,bathrooms,area_m2,status)
  ON public.profolio_listings TO authenticated;
GRANT DELETE ON public.profolio_listings TO authenticated;
GRANT SELECT ON public.profolio_listing_photos TO anon, authenticated;
GRANT INSERT (listing_id,storage_path,position,caption) ON public.profolio_listing_photos TO authenticated;
GRANT UPDATE (position,caption) ON public.profolio_listing_photos TO authenticated;
GRANT DELETE ON public.profolio_listing_photos TO authenticated;
GRANT SELECT ON public.profolio_leads TO authenticated;
GRANT SELECT ON public.profolio_listing_events TO authenticated;

CREATE POLICY "profolio profile owner reads" ON public.profolio_profiles FOR SELECT
USING (id = (SELECT auth.uid()) OR public.profolio_is_admin());
CREATE POLICY "profolio public agent contact opt-in" ON public.profolio_profiles FOR SELECT
USING (is_contact_public AND EXISTS (
 SELECT 1 FROM public.profolio_listings l
 WHERE l.agent_id = profolio_profiles.id AND l.status='published' AND l.moderation_status='approved'
));
CREATE POLICY "profolio profile own insert" ON public.profolio_profiles FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()) AND role='agent');
CREATE POLICY "profolio profile own update" ON public.profolio_profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profolio listing readable" ON public.profolio_listings FOR SELECT
USING (
 (status='published' AND moderation_status='approved')
 OR agent_id=(SELECT auth.uid()) OR public.profolio_is_admin()
);
CREATE POLICY "profolio listing owner insert" ON public.profolio_listings FOR INSERT TO authenticated
WITH CHECK (agent_id=(SELECT auth.uid()) AND moderation_status='pending');
CREATE POLICY "profolio listing owner update" ON public.profolio_listings FOR UPDATE TO authenticated
USING (agent_id=(SELECT auth.uid())) WITH CHECK (agent_id=(SELECT auth.uid()));
CREATE POLICY "profolio listing owner delete" ON public.profolio_listings FOR DELETE TO authenticated
USING (agent_id=(SELECT auth.uid()));

CREATE POLICY "profolio photos visible when listing visible" ON public.profolio_listing_photos FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profolio_listings l WHERE l.id=listing_id));
CREATE POLICY "profolio photos owner insert" ON public.profolio_listing_photos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profolio_listings l WHERE l.id=listing_id AND l.agent_id=(SELECT auth.uid())));
CREATE POLICY "profolio photos owner update" ON public.profolio_listing_photos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profolio_listings l WHERE l.id=listing_id AND l.agent_id=(SELECT auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.profolio_listings l WHERE l.id=listing_id AND l.agent_id=(SELECT auth.uid())));
CREATE POLICY "profolio photos owner delete" ON public.profolio_listing_photos FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profolio_listings l WHERE l.id=listing_id AND l.agent_id=(SELECT auth.uid())));

CREATE POLICY "profolio lead owner read" ON public.profolio_leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profolio_listings l
 WHERE l.id=listing_id AND (l.agent_id=(SELECT auth.uid()) OR public.profolio_is_admin())));
CREATE POLICY "profolio event owner read" ON public.profolio_listing_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profolio_listings l
 WHERE l.id=listing_id AND (l.agent_id=(SELECT auth.uid()) OR public.profolio_is_admin())));

-- Editing material listing data invalidates an earlier moderation approval.
-- Agents cannot bypass this because UPDATE(moderation_status) is not granted.
CREATE OR REPLACE FUNCTION public.profolio_invalidate_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF ROW(NEW.title,NEW.description,NEW.operation,NEW.property_type,NEW.price,
         NEW.currency,NEW.address,NEW.city,NEW.region,NEW.country,
         NEW.latitude,NEW.longitude,NEW.bedrooms,NEW.bathrooms,NEW.area_m2)
     IS DISTINCT FROM
     ROW(OLD.title,OLD.description,OLD.operation,OLD.property_type,OLD.price,
         OLD.currency,OLD.address,OLD.city,OLD.region,OLD.country,
         OLD.latitude,OLD.longitude,OLD.bedrooms,OLD.bathrooms,OLD.area_m2)
  THEN
    NEW.moderation_status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profolio_approval_invalidation ON public.profolio_listings;
CREATE TRIGGER profolio_approval_invalidation BEFORE UPDATE ON public.profolio_listings
FOR EACH ROW EXECUTE FUNCTION public.profolio_invalidate_approval();

-- Changing listing photos also requires a fresh moderation review.
-- Storage policies must separately forbid unreviewed overwrites of existing files.
CREATE OR REPLACE FUNCTION public.profolio_invalidate_photo_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_listing_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_listing_id := OLD.listing_id;
  ELSE v_listing_id := NEW.listing_id; END IF;
  UPDATE public.profolio_listings SET moderation_status='pending' WHERE id=v_listing_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profolio_invalidate_photo_change() FROM PUBLIC;
DROP TRIGGER IF EXISTS profolio_photo_approval_invalidation ON public.profolio_listing_photos;
CREATE TRIGGER profolio_photo_approval_invalidation AFTER INSERT OR UPDATE OR DELETE ON public.profolio_listing_photos
FOR EACH ROW EXECUTE FUNCTION public.profolio_invalidate_photo_change();

-- Only administrators can change moderation. Must be called by an authenticated admin.
CREATE OR REPLACE FUNCTION public.profolio_moderate_listing(p_listing uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.profolio_is_admin() THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  IF p_status NOT IN ('pending','approved','rejected') OR p_status IS NULL THEN
    RAISE EXCEPTION 'Invalid moderation status';
  END IF;
  UPDATE public.profolio_listings SET moderation_status=p_status WHERE id=p_listing;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.profolio_moderate_listing(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profolio_moderate_listing(uuid,text) TO authenticated;

-- Storage must be provisioned and tested separately with private buckets,
-- owner-only upload/delete policies and signed preview URLs.
-- Do not create any public file buckets in this migration.
COMMIT;
