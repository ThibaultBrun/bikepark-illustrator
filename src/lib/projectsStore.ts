import { supabase } from './supabase'
import type { BikeparkProject } from '../types/project'

// Itération 1 : un projet illustrator par utilisateur, stocké en jsonb dans
// public.illustrator_projects (remplace le localStorage). La matérialisation en
// spots/trails Pista + la soumission viendront ensuite.

export type SpotStatus = 'draft' | 'submitted' | 'published' | 'archived'
export type StoredProject = {
  id: string
  data: BikeparkProject
  title: string | null
  spotId: string | null
}

export async function loadUserProject(): Promise<StoredProject | null> {
  const { data, error } = await supabase
    .from('illustrator_projects')
    .select('id, data, title, spot_id')
    .order('updated_at', { ascending: false })
    .limit(1)
  if (error) {
    console.error('[projects] load', error)
    return null
  }
  const row = data?.[0]
  if (!row) return null
  return {
    id: row.id as string,
    data: row.data as BikeparkProject,
    title: (row.title as string) ?? null,
    spotId: (row.spot_id as string) ?? null,
  }
}

export async function getSpotStatus(spotId: string): Promise<SpotStatus | null> {
  const { data, error } = await supabase.from('spots').select('status').eq('id', spotId).maybeSingle()
  if (error) {
    console.error('[projects] spot status', error)
    return null
  }
  return (data?.status as SpotStatus) ?? null
}

export async function requestPublication(spotId: string): Promise<string | null> {
  const { error } = await supabase.rpc('request_spot_publication', { p_spot_id: spotId })
  if (error) {
    console.error('[publication]', error)
    return error.message
  }
  return null
}

export async function saveUserProject(
  projectId: string | null,
  snapshot: BikeparkProject,
  title: string,
): Promise<string | null> {
  // created_by est posé par défaut à auth.uid() côté DB (RLS l'impose).
  if (projectId) {
    const { error } = await supabase
      .from('illustrator_projects')
      .update({ data: snapshot, title, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (error) {
      console.error('[projects] update', error)
      return null
    }
    return projectId
  }

  const { data, error } = await supabase
    .from('illustrator_projects')
    .insert({ data: snapshot, title })
    .select('id')
    .single()
  if (error) {
    console.error('[projects] insert', error)
    return null
  }
  return (data?.id as string) ?? null
}

export type SubmitTrail = {
  name: string
  trail_type: string
  difficulty: string
  geometry: GeoJSON.Geometry
}

export async function submitProject(params: {
  name: string
  region: string
  spotType: string
  projectId: string | null
  trails: SubmitTrail[]
}): Promise<{ spotId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('submit_illustrator_project', {
    p_name: params.name,
    p_region: params.region,
    p_spot_type: params.spotType,
    p_project_id: params.projectId,
    p_trails: params.trails,
  })
  if (error) {
    console.error('[submit]', error)
    return { spotId: null, error: error.message }
  }
  return { spotId: (data as string) ?? null, error: null }
}

export async function deleteUserProject(projectId: string): Promise<boolean> {
  const { error } = await supabase.from('illustrator_projects').delete().eq('id', projectId)
  if (error) {
    console.error('[projects] delete', error)
    return false
  }
  return true
}
