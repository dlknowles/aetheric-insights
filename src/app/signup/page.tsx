'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupAction } from '@/app/actions/auth';
import { deriveKey, generateSalt } from '@/lib/crypto/browser';
import { useCryptoStore } from '@/lib/store/crypto';

export default function SignupPage() {
  const router = useRouter();
  const setMasterKey = useCryptoStore((state) => state.setMasterKey);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    
    // Generate the unique salt client-side
    const salt = generateSalt();
    formData.append('salt', salt);

    try {
      // 1. Establish the account and trigger profile creation
      const result = await signupAction(formData);

      if (result.error || !result.salt) {
        setError(result.error || 'Account creation failed.');
        setIsLoading(false);
        return;
      }

      // 2. Derive the AES-GCM key immediately so the user does not have to log in again
      const key = await deriveKey(password, result.salt);

      // 3. Store the key in memory
      setMasterKey(key);

      // 4. Navigate to the protected application area
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred during signup.');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2>Begin Your Journey</h2>
          <p>Create your zero-knowledge Aetheric Insights vault.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" required placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required placeholder="Password (make it strong)" />
            </div>
          </div>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Forging Vault...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Already have an account? Log in here.
          </Link>
        </div>
      </div>
    </div>
  );
}