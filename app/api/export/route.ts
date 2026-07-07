import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Whitelist of exportable tables and the exact columns/joins allowed for each.
// Keeping this server-side and explicit (rather than accepting arbitrary
// column/table names from the query string) prevents callers from requesting
// columns or tables that were never meant to be exported.
const EXPORT_CONFIG: Record<
  string,
  { table: string; select: string; order?: { column: string; ascending?: boolean }; filename: string }
> = {
  users: {
    table: 'app_users',
    select: 'id, name, phone, eco_points, total_kg, is_admin, created_at',
    order: { column: 'created_at', ascending: false },
    filename: 'users',
  },
  dropoffs: {
    table: 'drop_off_history',
    select:
      'id, weight_kg, material_type, points_earned, created_at, app_users(name), rvm_machines(machine_code, location_name)',
    order: { column: 'created_at', ascending: false },
    filename: 'dropoffs',
  },
  claims: {
    table: 'reward_claims',
    select: 'id, voucher_code, points_spent, claimed_at, app_users(name), rewards(title, partner)',
    order: { column: 'claimed_at', ascending: false },
    filename: 'reward-claims',
  },
  rewards: {
    table: 'rewards',
    select: 'id, title, partner, points_required, status, stock, total_claimed, expires_at',
    order: { column: 'points_required', ascending: true },
    filename: 'rewards',
  },
  withdrawals: {
    table: 'withdrawals',
    select: '*, app_users(name, phone)',
    order: { column: 'created_at', ascending: false },
    filename: 'withdrawals',
  },
  reports: {
    table: 'problem_reports',
    select: 'id, title, description, status, created_at, app_users(name)',
    order: { column: 'created_at', ascending: false },
    filename: 'problem-reports',
  },
  certificates: {
    table: 'certificates',
    select: 'id, cert_code, title, subtitle, year, level, total_kg, status, issued_at, app_users(name)',
    order: { column: 'issued_at', ascending: false },
    filename: 'certificates',
  },
  tasks: {
    table: 'tasks',
    select: '*',
    order: { column: 'created_at', ascending: false },
    filename: 'tasks',
  },
};

// Escapes a single CSV field per RFC 4180: wrap in quotes if it contains a
// comma, quote, or newline, and double up any internal quotes.
function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Flattens one row's values into a CSV line, resolving joined objects
// (e.g. app_users -> name) into a single readable column.
function flattenRow(row: Record<string, any>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        flat[`${key}_${nestedKey}`] = nestedValue;
      }
    } else {
      flat[key] = value;
    }
  }
  return flat;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Same admin gate as the dashboard layout — route handlers don't inherit
    // the layout's redirect, so we re-check here.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error('export: auth.getUser() failed:', authError);
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('is_admin')
      .eq('auth_id', user.id)
      .maybeSingle();
    if (profileError) {
      console.error('export: app_users lookup failed:', profileError);
      return NextResponse.json({ error: `Profile lookup error: ${profileError.message}` }, { status: 500 });
    }
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const type = request.nextUrl.searchParams.get('type') ?? '';
    const config = EXPORT_CONFIG[type];
    if (!config) {
      return NextResponse.json(
        { error: `Unknown export type. Valid types: ${Object.keys(EXPORT_CONFIG).join(', ')}` },
        { status: 400 }
      );
    }

    // Use the service-role client for the actual query (same approach the
    // Withdrawals page itself uses) so RLS restricted to "own rows only"
    // doesn't silently truncate what the admin exports. The auth/admin check
    // above already gated access using the regular session-bound client.
    const serviceClient = createServiceClient();
    let query = serviceClient.from(config.table).select(config.select);
    if (config.order) {
      query = query.order(config.order.column, { ascending: config.order.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) {
      console.error(`export: query failed for type="${type}" table="${config.table}":`, error);
      return NextResponse.json({ error: `Query error (${config.table}): ${error.message}` }, { status: 500 });
    }

    const rows = (data ?? []).map(flattenRow);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => csvField(row[h])).join(',')),
    ];
    const csv = csvLines.join('\n');

    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${config.filename}-${date}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('export: unhandled exception:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown server error' }, { status: 500 });
  }
}
