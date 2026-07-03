'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export async function resetMachineCapacity(formData: FormData) {
  const machineId = formData.get('machineId') as string;
  if (!machineId) return;

  const supabase = createServiceClient();
  await supabase
    .from('rvm_machines')
    .update({ current_kg: 0 })
    .eq('id', machineId);

  // capacity_pct and status are recalculated automatically by the trigger

  revalidatePath('/dashboard/dropoffs');
}
