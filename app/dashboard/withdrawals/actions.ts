'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export async function updateWithdrawalStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string; // 'approved' | 'rejected'

  if (!id || !status) return;

  const supabase = createServiceClient();

  // If rejecting, refund the points back to the user
  if (status === 'rejected') {
    const { data: w } = await supabase
      .from('withdrawals')
      .select('user_id, points_spent, status')
      .eq('id', id)
      .single();

    if (w && w.status === 'pending') {
      const { data: user } = await supabase
        .from('app_users')
        .select('eco_points')
        .eq('id', w.user_id)
        .single();

      if (user) {
        await supabase
          .from('app_users')
          .update({ eco_points: (user.eco_points ?? 0) + w.points_spent })
          .eq('id', w.user_id);
      }
    }
  }

  await supabase
    .from('withdrawals')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/dashboard/withdrawals');
}
