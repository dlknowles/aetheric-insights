import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch the user's encrypted journeys, ordered by most recent
  const { data: journeys, error: journeysError } = await supabase
    .from('journeys')
    .select('id, journey_date, encrypted_content, iv, created_at')
    .eq('user_id', user.id)
    .order('journey_date', { ascending: false });

  if (journeysError) {
    console.error('Error fetching journeys:', journeysError);
    // In a production app, handle this gracefully. For the MVP, we pass an empty array.
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2>The Vault</h2>
          <p className="text-sm text-gray-400">Your aetheric records, cryptographically sealed.</p>
        </div>
        <button className="btn btn-primary w-auto">
          Log New Journey
        </button>
      </header>

      <main>
        <DashboardClient encryptedJourneys={journeys || []} />
      </main>
    </div>
  );
}