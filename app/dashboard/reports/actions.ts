'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateReport(formData: FormData) {
  const reportId = formData.get('reportId') as string;
  const status = formData.get('status') as string;
  const adminNotes = (formData.get('adminNotes') as string)?.trim();
  if (!reportId || !status) return;

  const supabase = createClient();
  await supabase
    .from('problem_reports')
    .update({
      status,
      admin_notes: adminNotes || null,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', reportId);

  revalidatePath('/dashboard/reports');
}
