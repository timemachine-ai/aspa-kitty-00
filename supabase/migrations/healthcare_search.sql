-- =============================================
-- TimeMachine Healthcare: Smart Drug Search
-- Run these SQL statements in the Supabase SQL editor
-- =============================================

-- Step 1: Enable the pg_trgm extension for fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Create trigram indexes for fast similarity search
-- on the brands and generics tables
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm
  ON brands USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_generics_name_trgm
  ON generics USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_generics_indication_trgm
  ON generics USING gin (indication gin_trgm_ops);

-- Step 3: Create the search RPC function
-- This performs a ranked similarity search across brand name,
-- generic name, and indications — all at once.
CREATE OR REPLACE FUNCTION search_drugs(search_query text)
RETURNS TABLE (
  brand_id       bigint,
  brand_name     text,
  generic_id     bigint,
  generic_name   text,
  form           text,
  strength       text,
  price          text,
  pack_size      text,
  manufacturer   text,
  indication     text,
  side_effect    text,
  precaution     text,
  adult_dose     text,
  child_dose     text,
  pregnancy_cat  text,
  relevance      real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    b.id                           AS brand_id,
    b.name                         AS brand_name,
    g.id                           AS generic_id,
    g.name                         AS generic_name,
    b.form,
    b.strength,
    b.price,
    b.pack_size,
    m.name                         AS manufacturer,
    g.indication,
    g.side_effect,
    g.precaution,
    g.adult_dose,
    g.child_dose,
    pc.id                          AS pregnancy_cat,
    -- Compute a composite similarity score:
    -- brand name gets highest weight (3x),
    -- generic name gets high weight (2x),
    -- indication gets 1x weight (symptom search)
    GREATEST(
      similarity(b.name, search_query) * 3,
      similarity(g.name, search_query) * 2,
      similarity(COALESCE(g.indication, ''), search_query) * 1
    ) AS relevance
  FROM brands b
  JOIN generics g  ON b.generic_id      = g.id
  JOIN manufacturers m ON b.manufacturer_id = m.id
  LEFT JOIN pregnancy_categories pc ON g.pregnancy_category_id = pc.id
  WHERE
    -- Only return results that have at least a minimal similarity score
    -- This filters out completely irrelevant rows
    (
      similarity(b.name, search_query) > 0.1
      OR similarity(g.name, search_query) > 0.1
      OR similarity(COALESCE(g.indication, ''), search_query) > 0.05
      -- Also support ILIKE prefix matching for short queries (< 4 chars)
      OR b.name ILIKE '%' || search_query || '%'
      OR g.name ILIKE '%' || search_query || '%'
      OR g.indication ILIKE '%' || search_query || '%'
    )
  ORDER BY relevance DESC
  LIMIT 20;
$$;
