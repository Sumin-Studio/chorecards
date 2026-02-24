'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChoreCard, { ChoreCardData, Rarity } from '@/app/components/ChoreCard';
import { getCards, deleteCard, RARITIES } from '@/app/lib/store';

const ALL = 'ALL';
type Filter = typeof ALL | Rarity;

export default function CollectionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<ChoreCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(ALL);
  const [numPlayers, setNumPlayers] = useState('');
  const [cardsPerPlayer, setCardsPerPlayer] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = cards.filter((c) => filter === ALL || c.rarity === filter);

  return (
    <div className="flex h-screen overflow-hidden graph-paper">

      {/* ── Left Sidebar ── */}
      <aside
        className="flex flex-col justify-between shrink-0 h-full px-5 py-6"
        style={{
          width: 220,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRight: '1px solid #C6C6C6',
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Title */}
          <h1
            className="text-xl leading-tight"
            style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              color: '#414141',
            }}
          >
            CHORE<br />PACKER
          </h1>

          <div style={{ borderTop: '1px solid #C6C6C6' }} />

          {/* Game setup */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: '-0.04em', color: '#898383' }}>
                How many players ?
              </label>
              <input
                type="number" min="1" max="10"
                value={numPlayers}
                onChange={(e) => setNumPlayers(e.target.value)}
                placeholder="e.g. 3"
                className="w-full rounded-xl px-3 py-2 text-sm text-[#414141] placeholder-[#CFCFCF] focus:outline-none focus:border-[#414141]"
                style={{ background: '#FBFBFB', border: '1px solid #C6C6C6', fontFamily: 'var(--font-courier-prime), monospace', boxShadow: 'inset 0px 4px 0.1px #FFFFFF' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: '-0.04em', color: '#898383' }}>
                Cards per player ?
              </label>
              <input
                type="number" min="1" max="10"
                value={cardsPerPlayer}
                onChange={(e) => setCardsPerPlayer(e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-xl px-3 py-2 text-sm text-[#414141] placeholder-[#CFCFCF] focus:outline-none focus:border-[#414141]"
                style={{ background: '#FBFBFB', border: '1px solid #C6C6C6', fontFamily: 'var(--font-courier-prime), monospace', boxShadow: 'inset 0px 4px 0.1px #FFFFFF' }}
              />
            </div>
          </div>

          {/* Rarity filters */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs mb-0.5" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: '-0.04em', color: '#AFAFAF' }}>
              Filter
            </p>
            {([ALL, ...RARITIES] as Filter[]).map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className="text-left text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  fontFamily: 'var(--font-courier-prime), monospace',
                  fontWeight: filter === r ? 700 : 400,
                  background: filter === r ? '#414141' : 'transparent',
                  color: filter === r ? '#FFFFFF' : '#898383',
                  border: filter === r ? '1px solid #414141' : '1px solid transparent',
                }}
              >
                {r === ALL ? 'All cards' : r[0] + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Play button */}
        <button
          className="btn-primary w-full py-3 text-sm"
          disabled={cards.length === 0 || !numPlayers || !cardsPerPlayer}
          onClick={() => router.push(`/pack?players=${numPlayers}&cards=${cardsPerPlayer}`)}
        >
          Play →
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-full text-[#AFAFAF] text-sm" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>
            Loading cards...
          </div>
        )}

        {/* Empty state */}
        {!loading && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <p className="text-2xl font-bold" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.06em', color: '#414141' }}>
              No cards yet
            </p>
            <p className="text-sm text-[#AFAFAF]">Add some chore cards to get started.</p>
            <button onClick={() => router.push('/create')} className="btn-secondary px-8 py-3 text-sm">
              + Add cards
            </button>
          </div>
        )}

        {/* Card grid */}
        {!loading && filtered.length > 0 && (
          <div className="p-6">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {filtered.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col items-center gap-1.5 group"
                  style={{ opacity: deletingId === card.id ? 0.2 : 1, transition: 'opacity 0.15s' }}
                >
                  <ChoreCard card={card} size="sm" />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => router.push(`/create?edit=${card.id}`)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                    <button
                      onClick={() => card.id && handleDelete(card.id)}
                      className="text-xs px-2.5 py-1 rounded-xl border border-red-200 bg-white text-red-400 hover:text-red-600 hover:border-red-400 transition-all"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && cards.length > 0 && filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#AFAFAF] text-sm" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>
            No {filter.toLowerCase()} cards.
          </div>
        )}

        {/* New card button */}
        <button onClick={() => router.push('/create')} className="btn-secondary fixed bottom-6 right-6 px-5 py-2.5 text-sm z-10">
          New card +
        </button>
      </main>
    </div>
  );
}
