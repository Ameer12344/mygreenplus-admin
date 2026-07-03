'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Enter your email and password.'));
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect('/login?error=' + encodeURIComponent('Incorrect email or password.'));
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('is_admin')
    .eq('auth_id', data.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    redirect('/login?error=' + encodeURIComponent('This account does not have admin access.'));
  }

  redirect('/dashboard');
}
