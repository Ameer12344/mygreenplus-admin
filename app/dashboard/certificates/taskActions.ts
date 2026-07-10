'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export async function createTask(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const goalType = formData.get('goalType') as string;
  const goalValue = parseFloat(formData.get('goalValue') as string);
  const materialType = (formData.get('materialType') as string)?.trim() || null;

  if (!title || !goalType || isNaN(goalValue)) return;

  const supabase = createServiceClient();
  await supabase.from('tasks').insert({
    title,
    description: description || '',
    goal_type: goalType,
    goal_value: goalValue,
    material_type: materialType || null,
    status: 'active',
  });

  revalidatePath('/dashboard/certificates');
}

export async function deleteTask(formData: FormData) {
  const taskId = formData.get('taskId') as string;
  if (!taskId) return;

  const supabase = createServiceClient();
  await supabase.from('tasks').delete().eq('id', taskId);
  revalidatePath('/dashboard/certificates');
}

export async function toggleTaskStatus(formData: FormData) {
  const taskId = formData.get('taskId') as string;
  const nextStatus = formData.get('nextStatus') as string;
  if (!taskId || !nextStatus) return;

  const supabase = createServiceClient();
  await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId);
  revalidatePath('/dashboard/certificates');
}
