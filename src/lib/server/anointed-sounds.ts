import { createClient } from '@supabase/supabase-js';

export interface AnointedSoundItem {
  id: string;
  title: string;
  youtube_id: string;
  sort_order: number;
  created_at: string;
}

export async function getAnointedSoundsServer(): Promise<AnointedSoundItem[]> {
  try {
    const serviceUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!serviceUrl || !key) {
      return [];
    }

    const supabase = createClient(serviceUrl, key);
    const { data, error } = await supabase
      .from('anointed_sounds')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch anointed sounds:', error.message);
      return [];
    }

    return (data || []) as AnointedSoundItem[];
  } catch (error) {
    console.error('Failed to fetch anointed sounds:', error);
    return [];
  }
}
