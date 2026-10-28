import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRateLimitErrorResponse } from '@/lib/rate-limit';
import { requireAdmin, getSupabaseConfig } from '@/lib/admin';
import { sanitizeString } from '@/lib/validation';

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').split('?')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.includes('/shorts/')) {
        const id = u.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (u.pathname.includes('/embed/')) {
        const id = u.pathname.split('/embed/')[1].split('/')[0].split('?')[0];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    // ignore
  }
  const match = trimmed.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ sounds: [] }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from('anointed_sounds')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ sounds: [], error: error.message }, { status: 500 });
    return NextResponse.json({ sounds: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ sounds: [], error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:anointed-sounds', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    let { title = '', youtubeUrl = '', youtube_id = '' } = body;
    title = sanitizeString(title);

    const extracted = youtube_id || extractYoutubeId(youtubeUrl);
    if (!extracted) {
      return NextResponse.json({ success: false, error: 'Invalid YouTube URL or ID' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { count } = await supabase.from('anointed_sounds').select('*', { count: 'exact', head: true });
    const { data, error } = await supabase
      .from('anointed_sounds')
      .insert([{ title, youtube_id: extracted, sort_order: count || 0 }])
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, sound: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
