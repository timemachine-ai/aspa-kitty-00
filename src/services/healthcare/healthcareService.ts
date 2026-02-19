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

/**
 * Search drugs using the pg_trgm-powered Postgres RPC function.
 * Falls back to a multi-query ILIKE search if the RPC is unavailable.
 */
export async function searchDrugs(query: string): Promise<DrugSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();

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

  // B+C — generics matching by name OR indication
  const { data: matchingGenerics } = await supabase
    .from('generics')
    .select('id, name, indication')
    .or(`name.ilike.${ilike},indication.ilike.${ilike}`)
    .limit(40);

  let byGeneric: any[] = [];
  if (matchingGenerics && matchingGenerics.length > 0) {
    const genericIds = matchingGenerics.map((g) => g.id);
    // rank: generics matched by name score higher than by indication
    const nameMatchIds = new Set(
      matchingGenerics.filter((g) => g.name?.toLowerCase().includes(query.toLowerCase())).map((g) => g.id)
    );

    const { data } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .in('generic_id', genericIds)
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
  query: string
): Promise<DrugSearchResult[]> {
  const results = await searchDrugs(query);
  return results.slice(0, 5);
}
