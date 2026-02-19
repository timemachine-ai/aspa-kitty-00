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
 * Searches across brand names, generic names, and indications.
 * Falls back to ILIKE search if the RPC is unavailable.
 */
export async function searchDrugs(query: string): Promise<DrugSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();

  // Primary: use the fuzzy RPC function
  const { data, error } = await supabase.rpc('search_drugs', {
    search_query: trimmed,
  });

  if (error) {
    console.warn('[Healthcare] RPC error, falling back to ILIKE:', error.message);
    return fallbackSearch(trimmed);
  }

  return (data as DrugSearchResult[]) ?? [];
}

/**
 * Fallback ILIKE search when the RPC function is not yet available.
 * Searches brand name and generic name.
 */
async function fallbackSearch(query: string): Promise<DrugSearchResult[]> {
  const { data, error } = await supabase
    .from('brands')
    .select(`
      id,
      name,
      form,
      strength,
      price,
      pack_size,
      manufacturers ( name ),
      generics (
        id,
        name,
        indication,
        side_effect,
        precaution,
        adult_dose,
        child_dose,
        pregnancy_category_id
      )
    `)
    .or(`name.ilike.%${query}%,generics.name.ilike.%${query}%`)
    .limit(20);

  if (error || !data) return [];

  return data.map((b: any) => ({
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
    relevance: 1,
  }));
}

/**
 * Get autocomplete suggestions (top 5) for a given partial query.
 */
export async function getAutocompleteSuggestions(
  query: string
): Promise<DrugSearchResult[]> {
  const results = await searchDrugs(query);
  return results.slice(0, 5);
}
