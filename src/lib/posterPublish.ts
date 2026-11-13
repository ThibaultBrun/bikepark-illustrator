// Upload a poster PNG blob to Supabase Storage and return its public URL.
// Bucket "illustrator-posters" must be public (no-auth reads).
import { supabase } from './supabase'

const BUCKET = 'illustrator-posters'

export async function uploadPoster(
  projectId: string,
  blob: Blob,
): Promise<string | null> {
  const path = `${projectId}.png`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    })
  if (error) {
    console.error('[posterPublish] upload', error)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl ?? null
}
