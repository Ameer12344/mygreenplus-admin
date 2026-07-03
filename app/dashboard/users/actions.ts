'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function adjustPoints(formData: FormData) {
  const userId = formData.get('userId') as string;
  const delta = Number(formData.get('delta'));
  if (!userId || Number.isNaN(delta) || delta === 0) return;

  const supabase = createClient();
  const { data: user } = await supabase
    .from('app_users')
    .select('eco_points')
    .eq('id', userId)
    .single();

  const current = user?.eco_points ?? 0;
  const next = Math.max(0, current + delta);

  await supabase.from('app_users').update({ eco_points: next }).eq('id', userId);
  revalidatePath('/dashboard/users');
}

export async function toggleAdmin(formData: FormData) {
  const userId = formData.get('userId') as string;
  const nextValue = formData.get('nextValue') === 'true';
  if (!userId) return;

  const supabase = createClient();
  await supabase.from('app_users').update({ is_admin: nextValue }).eq('id', userId);
  revalidatePath('/dashboard/users');
}
