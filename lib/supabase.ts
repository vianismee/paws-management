import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper function to subscribe to table changes
export function subscribeToTable<T>(
  table: string,
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE',
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`public-${table}`)
    .on(
      'postgres_changes',
      {
        event: event,
        schema: 'public',
        table: table,
      },
      callback
    )
    .subscribe()

  return channel
}

// Helper function to unsubscribe from channel
export function unsubscribeFromChannel(channel: any) {
  supabase.removeChannel(channel)
}