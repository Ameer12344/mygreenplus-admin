'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const ACCENT_COLORS = ['#2E7D32', '#1565C0', '#6A1B9A', '#F57C00', '#00897B'];

export async function issueCertificate(formData: FormData) {
  const userId = formData.get('userId') as string;
  const title = (formData.get('title') as string)?.trim();
  const subtitle = (formData.get('subtitle') as string)?.trim();
  const year = (formData.get('year') as string)?.trim();
  const level = (formData.get('level') as string)?.trim();
  const totalKg = parseFloat(formData.get('totalKg') as string);

  if (!userId || !title || !year || !level) return;

  const certCode = `MGP-${year}-${Date.now().toString().substring(8)}`;

  const serviceClient = createServiceClient();
  await serviceClient.from('certificates').insert({
    user_id: userId,
    cert_code: certCode,
    title,
    subtitle: subtitle || '',
    year,
    level,
    total_kg: isNaN(totalKg) ? 0 : totalKg,
    status: 'valid',
    accent_color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
  });

  revalidatePath('/dashboard/certificates');
}

export async function deleteCertificate(formData: FormData) {
  const certId = formData.get('certId') as string;
  if (!certId) return;

  const serviceClient = createServiceClient();
  await serviceClient.from('certificates').delete().eq('id', certId);
  revalidatePath('/dashboard/certificates');
}
