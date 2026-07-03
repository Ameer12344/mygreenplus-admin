'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addReward(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const partner = (formData.get('partner') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const points = Number(formData.get('points'));
  const stock = Number(formData.get('stock'));
  const expiresAt = formData.get('expiresAt') as string;

  if (!title || !points) return;

  const supabase = createClient();
  await supabase.from('rewards').insert({
    title,
    partner: partner || null,
    description: description || null,
    points_required: points,
    stock: Number.isFinite(stock) ? stock : null,
    status: 'active',
    total_claimed: 0,
    expires_at: expiresAt || null,
  });

  revalidatePath('/dashboard/rewards');
}

export async function deleteReward(formData: FormData) {
  const rewardId = formData.get('rewardId') as string;
  if (!rewardId) return;

  const supabase = createClient();
  await supabase.from('rewards').delete().eq('id', rewardId);
  revalidatePath('/dashboard/rewards');
}

export async function toggleRewardStatus(formData: FormData) {
  const rewardId = formData.get('rewardId') as string;
  const nextStatus = formData.get('nextStatus') as string;
  if (!rewardId || !nextStatus) return;

  const supabase = createClient();
  await supabase.from('rewards').update({ status: nextStatus }).eq('id', rewardId);
  revalidatePath('/dashboard/rewards');
}