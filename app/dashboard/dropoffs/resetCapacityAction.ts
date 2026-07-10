'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export async function resetMachineCapacity(formData: FormData) {
  const machineId = formData.get('machineId') as string;
  if (!machineId) return;

  const supabase = createServiceClient();
  await supabase
    .from('rvm_machines')
    .update({ current_kg: 0, is_manual_override: false })
    .eq('id', machineId);

  // capacity_pct and status are recalculated automatically by the trigger
  // now that is_manual_override is cleared (this is also how a machine
  // exits 'maintenance' status back into automatic tracking).

  revalidatePath('/dashboard/dropoffs');
}
