'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCryptoStore } from '@/lib/store/crypto';
import { decryptData } from '@/lib/crypto/browser';

interface EncryptedJourney {
  id: string;
  journey_date: string;
  encrypted_content: string;
  iv: string;
  created_at: string;
}

interface DecryptedJourney extends EncryptedJourney {
  plaintext: string;
}

export default function DashboardClient({ encryptedJourneys }: { encryptedJourneys: EncryptedJourney[] }) {
  const masterKey = useCryptoStore((state) => state.masterKey);
  const [decryptedJourneys, setDecryptedJourneys] = useState<DecryptedJourney[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performDecryption() {
      if (!masterKey) {
        setIsDecrypting(false);
        return;
      }

      try {
        const decrypted = await Promise.all(
          encryptedJourneys.map(async (journey) => {
            const plaintext = await decryptData(journey.encrypted_content, journey.iv, masterKey);
            return { ...journey, plaintext };
          })
        );
        setDecryptedJourneys(decrypted);
      } catch (err) {
        console.error('Decryption failed:', err);
        setError('Failed to decrypt your records. The cryptographic key may be invalid.');
      } finally {
        setIsDecrypting(false);
      }
    }

    performDecryption();
  }, [encryptedJourneys, masterKey]);

  // Handle the hard-refresh scenario where the session exists but the key is wiped
  if (!masterKey) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-6 text-center">
        <h3 className="mb-2">Vault Locked</h3>
        <p className="mb-4 text-gray-400">
          Your session is active, but your cryptographic key has been cleared from memory for your protection.
        </p>
        <Link href="/login" className="btn btn-secondary inline-flex w-auto">
          Re-enter Password to Unlock
        </Link>
      </div>
    );
  }

  if (isDecrypting) {
    return <p className="animate-pulse text-gray-400">Decrypting records...</p>;
  }

  if (error) {
    return <p className="alert-error">{error}</p>;
  }

  if (decryptedJourneys.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>Your vault is currently empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {decryptedJourneys.map((journey) => (
        <article key={journey.id} className="rounded-md border border-white/10 bg-white/5 p-6 shadow-sm">
          <header className="mb-4">
            <time className="text-sm font-medium text-indigo-400">
              {new Date(journey.journey_date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </header>
          <div className="journal-prose">
            {/* For the MVP, we simply render the plaintext. 
              Later, we can parse this if you choose to store markdown or structured JSON.
            */}
            <p>{journey.plaintext}</p>
          </div>
        </article>
      ))}
    </div>
  );
}