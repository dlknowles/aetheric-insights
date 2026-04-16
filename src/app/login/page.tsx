'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { deriveKey } from '@/lib/crypto/browser';
import { useCryptoStore } from '@/lib/store/crypto';

export default function LoginPage() {
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

    try {
      // 1. Establish the secure server-side session and fetch the salt
      const result = await loginAction(formData);

      if (result.error || !result.salt) {
        setError(result.error || 'Authentication failed.');
        setIsLoading(false);
        return;
      }

      // 2. Derive the AES-GCM key using the plaintext password and the database salt
      const key = await deriveKey(password, result.salt);

      // 3. Store the key in memory (Zustand)
      setMasterKey(key);

      // 4. Navigate to the protected application area
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred during login.');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2>
            Access Aetheric Insights
          </h2>
          <p>
            Your journeys are end-to-end encrypted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" required placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required placeholder="Password" />
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Decrypting...' : 'Unlock Journal'}
          </button>
        </form>
      </div>
    </div>
  );
}