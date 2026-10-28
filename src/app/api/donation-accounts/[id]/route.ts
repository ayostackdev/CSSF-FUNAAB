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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:donation-accounts-id', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = params;
    const body = await request.json();

    const updates: Record<string, any> = {};

    if (body.purpose !== undefined) {
      const purpose = sanitizeString(body.purpose);
      if (!purpose) return NextResponse.json({ success: false, error: 'Purpose is required' }, { status: 400 });
      updates.purpose = purpose;
    }
    if (body.accountName !== undefined) {
      const accountName = sanitizeString(body.accountName);
      if (!accountName || !validateAccountName(accountName)) {
        return NextResponse.json({ success: false, error: 'Invalid account name format' }, { status: 400 });
      }
      updates.account_name = accountName;
    }
    if (body.accountNumber !== undefined) {
      const accountNumber = sanitizeString(body.accountNumber);
      if (!accountNumber || !validateAccountNumber(accountNumber)) {
        return NextResponse.json({ success: false, error: 'Invalid account number format' }, { status: 400 });
      }
      updates.account_number = accountNumber;
    }
    if (body.bank !== undefined) {
      const bank = sanitizeString(body.bank);
      if (!bank || !validateBankName(bank)) {
        return NextResponse.json({ success: false, error: 'Invalid bank name format' }, { status: 400 });
      }
      updates.bank = bank;
    }
    if (body.isActive !== undefined) {
      updates.is_active = body.isActive !== false;
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
    const { data, error } = await supabase
      .from('donation_accounts')
      .update(updates)
      .eq('id', id)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateLimitError = getRateLimitErrorResponse(request, 'api:donation-accounts-id', 20, 60_000);
    if (rateLimitError) return rateLimitError;

    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = params;
    const { supabaseUrl, serviceKey } = getSupabaseConfig();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('donation_accounts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
