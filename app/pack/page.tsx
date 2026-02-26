'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCards, createPack, drawCards } from '@/app/lib/store';
import { ChoreCardData } from '@/app/components/ChoreCard';

interface PlayerPack {
  player: number;
  cards: ChoreCardData[];
  token: string;
  link: string;
  copied: boolean;
}

function PackGenerator() {
  const router = useRouter();
  const params = useSearchParams();
  const numPlayers = parseInt(params.get('players') ?? '1');
  const cardsPerPlayer = parseInt(params.get('cards') ?? '3');

  const [packs, setPacks] = useState<PlayerPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function generate() {
      try {
        const allCards = await getCards();
        if (allCards.length === 0) {
          setError('No cards in your deck. Add some cards first.');
          setLoading(false);
          return;
        }

        const generated: PlayerPack[] = [];
        for (let i = 0; i < numPlayers; i++) {
          const drawn = drawCards(allCards, cardsPerPlayer);
          const cardIds = drawn.map((c) => c.id!);
          const token = await createPack(cardIds);
          const link = `${window.location.origin}/open/${token}`;
          generated.push({ player: i + 1, cards: drawn, token, link, copied: false });
        }
        setPacks(generated);
      } catch (e) {
        console.error(e);
        setError('Something went wrong generating packs.');
      } finally {
        setLoading(false);
      }
    }
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyLink(index: number) {
    navigator.clipboard.writeText(packs[index].link);
    setPacks((prev) => prev.map((p, i) => ({ ...p, copied: i === index })));
    setTimeout(() => {
      setPacks((prev) => prev.map((p, i) => ({ ...p, copied: i === index ? false : p.copied })));
    }, 2000);
  }

  return (
    <div className="flex h-screen overflow-hidden graph-paper">

      {/* Sidebar */}
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
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#898383] hover:text-[#414141] transition-colors flex items-center gap-1 self-start"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
          >
            ← back
          </button>
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

          {!loading && !error && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-[#AFAFAF]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: '-0.04em' }}>
                {numPlayers} player{numPlayers !== 1 ? 's' : ''} · {cardsPerPlayer} cards each
              </p>
              <p className="text-xs text-[#AFAFAF]" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>
                Share each link with your flatmates. Links expire in 7 days.
              </p>
            </div>
          )}
        </div>

        <button onClick={() => router.push('/')} className="btn-secondary w-full py-3 text-sm">
          ← New game
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 gap-6">

        {loading && (
          <p className="text-[#AFAFAF] text-sm" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>
            Dealing cards...
          </p>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[#414141] text-sm" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>{error}</p>
            <button onClick={() => router.push('/')} className="btn-primary px-6 py-3 text-sm">← Go back</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <h2
              className="text-2xl"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.06em',
                color: '#414141',
              }}
            >
              Packs are ready
            </h2>
            <p className="text-sm text-[#AFAFAF] -mt-3" style={{ fontFamily: 'var(--font-courier-prime), monospace' }}>
              Send each player their link — no account needed to open it
            </p>

            <div className="flex flex-col gap-4 w-full max-w-lg">
              {packs.map((pack, i) => (
                <div
                  key={pack.token}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid #C6C6C6',
                    boxShadow: '0px 1px 2px rgba(0,0,0,0.08), inset 0px 2px 0px #FFFFFF',
                  }}
                >
                  {/* Player label + rarity preview */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: '-0.04em', color: '#414141' }}
                    >
                      Player {pack.player}
                    </span>
                    {/* Rarity dots */}
                    <div className="flex gap-1">
                      {pack.cards.map((card, ci) => {
                        const colors: Record<string, string> = {
                          COMMON: '#CCCCCC',
                          UNCOMMON: '#00FF66',
                          RARE: '#6E00FF',
                          LEGENDARY: '#FF9E16',
                        };
                        return (
                          <span
                            key={ci}
                            title={card.rarity}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: colors[card.rarity],
                              display: 'inline-block',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Link + copy */}
                  <div className="flex gap-2 items-center">
                    <code
                      className="flex-1 text-xs px-3 py-2 rounded-xl truncate"
                      style={{
                        background: '#F0F0F0',
                        border: '1px solid #D6D3D3',
                        fontFamily: 'var(--font-courier-prime), monospace',
                        color: '#898383',
                      }}
                    >
                      {pack.link}
                    </code>
                    <button
                      onClick={() => copyLink(i)}
                      className="btn-primary px-4 py-2 text-xs shrink-0"
                    >
                      {pack.copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Open button */}
                  <button
                    onClick={() => window.open(pack.link, '_blank')}
                    className="btn-secondary w-full py-2.5 text-sm"
                  >
                    Open my pack →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PackPage() {
  return (
    <Suspense fallback={
      <div className="graph-paper h-screen flex items-center justify-center">
        <span style={{ color: '#AFAFAF', fontFamily: 'var(--font-courier-prime), monospace' }}>Loading...</span>
      </div>
    }>
      <PackGenerator />
    </Suspense>
  );
}
