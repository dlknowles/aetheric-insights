'use server';

import { createClient } from '@/lib/supabase/server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  // 1. Authenticate and set HTTP-only cookies
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Fetch the user's unique encryption salt
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('encryption_salt')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profileData?.encryption_salt) {
    return { error: 'Failed to retrieve encryption profile.' };
  }

  // 3. Return the salt to the client. 
  // We DO NOT redirect here. The client must await this, derive the key, and then route.
  return { 
    success: true, 
    salt: profileData.encryption_salt 
  };
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const salt = formData.get('salt') as string;

  if (!email || !password || !salt) {
    return { error: 'Email, password, and encryption salt are required.' };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        encryption_salt: salt,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Note: If email confirmations are enabled in Supabase, authData.session will be null.
  // For this MVP seamless flow, ensure "Confirm email" is disabled in Supabase Auth settings.
  return { 
    success: true, 
    salt: salt 
  };
}