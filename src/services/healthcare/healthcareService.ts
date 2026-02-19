import { supabase } from '../../lib/supabase';

export interface DrugSearchResult {
  brand_id: number;
  brand_name: string;
  generic_id: number;
  generic_name: string;
  form: string;
  strength: string;
  price: string;
  pack_size: string;
  manufacturer: string;
  indication: string;
  side_effect: string;
  precaution: string;
  adult_dose: string;
  child_dose: string;
  pregnancy_cat: string;
  relevance: number;
}

export type SearchCategory = 'brand' | 'generic' | 'indication';

/**
 * Search drugs using the pg_trgm-powered Postgres RPC function.
 * Falls back to a multi-query ILIKE search if the RPC is unavailable.
 * When a category is provided, only searches that specific field.
 */
export async function searchDrugs(query: string, category?: SearchCategory): Promise<DrugSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();

  // If a specific category is given, use category-specific search
  if (category) {
    return categorySearch(trimmed, category);
  }

  const { data, error } = await supabase.rpc('search_drugs', {
    search_query: trimmed,
  });

  if (error) {
    console.warn('[Healthcare] RPC error, falling back to ILIKE:', error.message);
    return fallbackSearch(trimmed);
  }

  return (data as DrugSearchResult[]) ?? [];
}

// ─── Helper: shape a raw brands row into DrugSearchResult ─────────────────────
function shapeBrand(b: any, relevance = 1): DrugSearchResult {
  return {
    brand_id: b.id,
    brand_name: b.name,
    generic_id: b.generics?.id ?? 0,
    generic_name: b.generics?.name ?? '',
    form: b.form ?? '',
    strength: b.strength ?? '',
    price: b.price ?? '',
    pack_size: b.pack_size ?? '',
    manufacturer: b.manufacturers?.name ?? '',
    indication: b.generics?.indication ?? '',
    side_effect: b.generics?.side_effect ?? '',
    precaution: b.generics?.precaution ?? '',
    adult_dose: b.generics?.adult_dose ?? '',
    child_dose: b.generics?.child_dose ?? '',
    pregnancy_cat: b.generics?.pregnancy_category_id ?? '',
    relevance,
  };
}

const BRAND_SELECT = `
  id, name, form, strength, price, pack_size,
  manufacturers ( name ),
  generics (
    id, name, indication, side_effect,
    precaution, adult_dose, child_dose, pregnancy_category_id
  )
`;

/**
 * Category-specific search — only searches within the chosen field.
 */
async function categorySearch(query: string, category: SearchCategory): Promise<DrugSearchResult[]> {
  const ilike = `%${query}%`;

  if (category === 'brand') {
    const { data } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .ilike('name', ilike)
      .limit(20);
    return (data ?? []).map((b: any) => shapeBrand(b, 1));
  }

  if (category === 'generic') {
    const { data: generics } = await supabase
      .from('generics')
      .select('id')
      .ilike('name', ilike)
      .limit(30);

    const ids = (generics ?? []).map((g: any) => g.id);
    if (ids.length === 0) return [];

    const { data } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .in('generic_id', ids)
      .limit(20);
    return (data ?? []).map((b: any) => shapeBrand(b, 0.8));
  }

  // category === 'indication'
  const { data: generics } = await supabase
    .from('generics')
    .select('id')
    .ilike('indication', ilike)
    .limit(30);

  const ids = (generics ?? []).map((g: any) => g.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from('brands')
    .select(BRAND_SELECT)
    .in('generic_id', ids)
    .limit(20);
  return (data ?? []).map((b: any) => shapeBrand(b, 0.5));
}

/**
 * Fallback ILIKE search using three separate queries so that
 * symptom/generic/brand searches all hit correctly.
 *
 * PostgREST does NOT support filtering on joined table columns inside .or(),
 * so we must query generics separately and then look up their brands.
 *
 *  Query A: brands WHERE name ILIKE '%q%'             → exact brand matches
 *  Query B: generics WHERE name ILIKE '%q%'           → generic name matches
 *  Query C: generics WHERE indication ILIKE '%q%'     → symptom/condition matches
 *  Then: fetch all brands whose generic_id is in B ∪ C
 */
async function fallbackSearch(query: string): Promise<DrugSearchResult[]> {
  const ilike = `%${query}%`;

  // A — brands by brand name (highest relevance)
  const { data: byBrandName } = await supabase
    .from('brands')
    .select(BRAND_SELECT)
    .ilike('name', ilike)
    .limit(20);

  // B — generics matching by generic name (e.g. "Paracetamol")
  // C — generics matching by indication text (e.g. "fever", "pain", "infection")
  // Run as TWO separate .ilike() queries — the combined .or() with % wildcards
  // does not encode reliably through the Supabase JS client in all versions.
  const [{ data: byGenericName }, { data: byIndication }] = await Promise.all([
    supabase.from('generics').select('id, name').ilike('name', ilike).limit(30),
    supabase.from('generics').select('id, name').ilike('indication', ilike).limit(30),
  ]);

  const nameMatchIds = new Set((byGenericName ?? []).map((g) => g.id));
  const allGenericIds = [
    ...new Set([
      ...(byGenericName ?? []).map((g) => g.id),
      ...(byIndication ?? []).map((g) => g.id),
    ]),
  ];

  let byGeneric: any[] = [];
  if (allGenericIds.length > 0) {
    const { data } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .in('generic_id', allGenericIds)
      .limit(30);

    byGeneric = (data ?? []).map((b: any) =>
      shapeBrand(b, nameMatchIds.has(b.generics?.id) ? 0.8 : 0.5)
    );
  }

  // Merge: brand-name hits first (relevance 1), then generic/indication hits
  const seen = new Set<number>();
  const combined: DrugSearchResult[] = [];

  for (const b of byBrandName ?? []) {
    if (!seen.has(b.id)) {
      seen.add(b.id);
      combined.push(shapeBrand(b, 1));
    }
  }
  for (const r of byGeneric) {
    if (!seen.has(r.brand_id)) {
      seen.add(r.brand_id);
      combined.push(r);
    }
  }

  // Sort by relevance desc
  return combined.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

/**
 * Top-5 autocomplete suggestions.
 */
export async function getAutocompleteSuggestions(
  query: string,
  category?: SearchCategory
): Promise<DrugSearchResult[]> {
  const results = await searchDrugs(query, category);
  return results.slice(0, 5);
}
