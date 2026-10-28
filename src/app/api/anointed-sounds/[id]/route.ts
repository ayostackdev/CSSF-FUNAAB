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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:anointed-sounds-id', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.title !== undefined) {
      const title = sanitizeString(body.title);
      if (!title) return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
      updates.title = title;
    }
    if (body.youtubeUrl !== undefined || body.youtube_id !== undefined) {
      const extracted = body.youtube_id || extractYoutubeId(body.youtubeUrl);
      if (!extracted) return NextResponse.json({ success: false, error: 'Invalid YouTube URL or ID' }, { status: 400 });
      updates.youtube_id = extracted;
    }
    if (body.sortOrder !== undefined) {
      updates.sort_order = Number(body.sortOrder) || 0;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.from('anointed_sounds').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, sound: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:anointed-sounds-id', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('anointed_sounds').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
