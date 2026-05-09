import { createServerComponentClient } from '@/lib/supabase/server'
import { ExploreClient } from './ExploreClient'

export default async function ExplorePage() {
  const supabase = await createServerComponentClient()
  const { data: needs } = await supabase
    .from('community_needs')
    .select('*')
    .in('status', ['open', 'claimed'])
    .order('created_at', { ascending: false })

  return <ExploreClient initialNeeds={needs ?? []} />
}
