import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRateLimitErrorResponse } from '@/lib/rate-limit';
import { requireAdmin, getSupabaseConfig } from '@/lib/admin';
import {
  validateAccountName,
  validateAccountNumber,
  validateBankName,
  sanitizeString,
} from '@/lib/validation';

export async function GET() {
  try {
    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ accounts: [], error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from('donation_accounts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ accounts: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ accounts: [], error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:donation-accounts', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    let { purpose = '', accountName = '', accountNumber = '', bank = '', isActive = true, sortOrder = 0 } = body;

    purpose = sanitizeString(purpose);
    accountName = sanitizeString(accountName);
    accountNumber = sanitizeString(accountNumber);
    bank = sanitizeString(bank);

    if (!purpose) {
      return NextResponse.json({ success: false, error: 'Purpose is required' }, { status: 400 });
    }
    if (!accountName || !validateAccountName(accountName)) {
      return NextResponse.json({ success: false, error: 'Invalid account name format' }, { status: 400 });
    }
    if (!accountNumber || !validateAccountNumber(accountNumber)) {
      return NextResponse.json({ success: false, error: 'Invalid account number format' }, { status: 400 });
    }
    if (!bank || !validateBankName(bank)) {
      return NextResponse.json({ success: false, error: 'Invalid bank name format' }, { status: 400 });
    }

    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from('donation_accounts')
      .insert([
        {
          purpose,
          account_name: accountName,
          account_number: accountNumber,
          bank,
          is_active: isActive !== false,
          sort_order: Number(sortOrder) || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
