import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function untuk get public URL
export const getPublicUrl = (bucket: string, path: string) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

// Helper function untuk upload file ke badges folder
export const uploadBadgeImage = async (file: File) => {
  console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type)
  
  const timestamp = Date.now()
  const filename = `${timestamp}-${file.name}`
  const path = `badges/${filename}`

  console.log('Upload path:', path)

  const { data, error } = await supabase.storage
    .from('ConnectSpace')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  console.log('Upload response - data:', data)
  console.log('Upload response - error:', error)

  if (error) {
    console.error('Upload error details:', error)
    throw new Error(error.message || 'Upload failed')
  }

  const publicUrl = getPublicUrl('connectspace', data.path)
  console.log('Generated public URL:', publicUrl)
  
  return publicUrl
}

// Helper function untuk delete file
export const deleteBadgeImage = async (imageUrl: string) => {
  // Extract path from URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/connectspace/badges/xxx
  const pathMatch = imageUrl.match(/badges\/.+/)
  if (!pathMatch) throw new Error('Invalid image URL')

  const { error } = await supabase.storage
    .from('ConnectSpace')
    .remove([pathMatch[0]])

  if (error) throw error
}
