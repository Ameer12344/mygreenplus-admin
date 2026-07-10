'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { calculatePoints } from '@/lib/points';

// Manually log a drop-off from the admin dashboard — a stand-in for a real
// QR/RVM scan while you don't have hardware to demo with. It writes to the
// exact same `drop_off_history` table and updates the same user fields a
// real machine's webhook would, so nothing else (tasks, certificates,
// overview stats) has to know the difference. Source is tagged 'manual' so
// you can tell these apart from real scans later.
export async function logDropoff(formData: FormData) {
  const userId = formData.get('userId') as string;
  const materialType = (formData.get('materialType') as string)?.trim();
  const weightKg = parseFloat(formData.get('weightKg') as string);
  const rvmId = (formData.get('rvmId') as string)?.trim() || null;

  if (!userId || !materialType || isNaN(weightKg) || weightKg <= 0) return;

  const pointsEarned = calculatePoints(materialType, weightKg);
  const supabase = createServiceClient();

  const { error: insertError } = await supabase.from('drop_off_history').insert({
  user_id: userId,
  rvm_id: rvmId,
  material_type: materialType,
  weight_kg: weightKg, 
  points_earned: pointsEarned,
});

if (insertError) {
  console.error('logDropoff insert failed:', insertError);
  return;
}

  const { data: user, error: fetchError } = await supabase
    .from('app_users')
    .select('eco_points, total_kg')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error('logDropoff: could not load user to update totals:', fetchError);
    return;
  }

  const nextPoints = (user.eco_points ?? 0) + pointsEarned;
  const nextTotalKg = (user.total_kg ?? 0) + weightKg;

  const { error: updateError } = await supabase
    .from('app_users')
    .update({ eco_points: nextPoints, total_kg: nextTotalKg })
    .eq('id', userId);

  if (updateError) {
    console.error('logDropoff: failed to update user totals:', updateError);
    return;
  }

  revalidatePath('/dashboard/dropoffs');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/certificates');
  revalidatePath('/dashboard/users');
}

export async function updateRvmStatus(formData: FormData) {
  const rvmId = formData.get('rvmId') as string;
  const status = formData.get('status') as string;

  if (!rvmId || !status) return;

  const supabase = createServiceClient();

  // Only touch `status` — capacity_pct is always derived automatically
  // from current_kg via the database trigger, so it must never be
  // manually overwritten here (doing so was wiping out real capacity
  // data whenever the status was changed, e.g. "Online" forced it to 0%).
  await supabase.from('rvm_machines').update({
    status,
    last_active: new Date().toISOString(),
  }).eq('id', rvmId);

  revalidatePath('/dashboard/dropoffs');
}
