import { supabase } from './supabase'

// Récupère les pistes publiées de Pista (vue carte) pour les afficher en calque
// de référence dans l'illustrator (lecture seule, non éditable).
export async function fetchPublishedTrails(): Promise<GeoJSON.FeatureCollection | null> {
  const { data, error } = await supabase
    .from('v_map_trails_geojson')
    .select('geojson')
    .maybeSingle()
  if (error) {
    console.error('[pista-trails]', error)
    return null
  }
  const fc = (data?.geojson as GeoJSON.FeatureCollection) ?? null
  if (!fc || !Array.isArray(fc.features)) return null
  return fc
}
