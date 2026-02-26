'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPack } from '@/app/lib/store';
import { ChoreCardData, rarityConfig } from '@/app/components/ChoreCard';

type Phase = 'loading' | 'sealed' | 'opening' | 'done' | 'expired';

export default function OpenPackPage() {
  const { token } = useParams<{ token: string }>();
  const [cards, setCards] = useState<ChoreCardData[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    getPack(token).then((result) => {
      if (!result || result.length === 0) {
        setPhase('expired');
      } else {
        setCards(result);
        setPhase('sealed');
      }
    });
  }, [token]);

  function startOpening() {
    setPhase('opening');
    revealCards(0, cards.length);
  }

  function revealCards(index: number, total: number) {
    if (index >= total) {
      setTimeout(() => setPhase('done'), 600);
      return;
    }
    setTimeout(() => {
      setRevealedCount(index + 1);
      revealCards(index + 1, total);
    }, index === 0 ? 400 : 700);
  }

  if (phase === 'loading') {
    return (
      <div className="graph-paper min-h-screen flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#AFAFAF' }}>
          Opening pack...
        </p>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="graph-paper min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-4xl">📦</p>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.06em', color: '#414141' }}
        >
          Pack expired
        </h1>
        <p style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#AFAFAF', fontSize: 14 }}>
          This link has expired or doesn&apos;t exist. Ask your flatmate to generate a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="graph-paper min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-12">

      {/* Sealed state */}
      {phase === 'sealed' && (
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <h1
              className="text-3xl font-bold text-center"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.06em', color: '#414141' }}
            >
              You got a pack!
            </h1>
            <p style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#AFAFAF', fontSize: 14 }}>
              {cards.length} card{cards.length !== 1 ? 's' : ''} inside
            </p>
          </div>

          {/* Pack visual */}
          <div
            className="pack-shimmer flex items-center justify-center"
            style={{
              width: 180,
              height: 240,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #414141 0%, #6b6b6b 40%, #414141 60%, #2a2a2a 100%)',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.35), 0px 2px 8px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={startOpening}
          >
            {/* Foil shimmer overlay */}
            <div
              className="pack-foil"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <p
              className="text-center z-10 relative"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              CHORE<br />CARDS
            </p>
          </div>

          <button onClick={startOpening} className="btn-primary px-10 py-4 text-base">
            Open pack →
          </button>
        </div>
      )}

      {/* Opening / Done state — card reveal */}
      {(phase === 'opening' || phase === 'done') && (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.06em', color: '#414141' }}
          >
            {phase === 'done' ? 'Your chores 👑' : 'Revealing...'}
          </h2>

          {/* Cards row */}
          <div className="flex flex-wrap gap-5 justify-center">
            {cards.map((card, i) => {
              const revealed = i < revealedCount;
              const config = rarityConfig[card.rarity];
              const isLegendary = card.rarity === 'LEGENDARY';

              return (
                <div
                  key={i}
                  className="card-flip-container"
                  style={{
                    width: 160,
                    height: 218,
                    perspective: 1000,
                  }}
                >
                  <div
                    className={`card-flip-inner ${revealed ? 'flipped' : ''}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Card back */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #414141 0%, #6b6b6b 40%, #414141 60%, #2a2a2a 100%)',
                        boxShadow: '0px 4px 16px rgba(0,0,0,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <p style={{
                        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 10,
                        letterSpacing: '-0.04em',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}>
                        CHORE<br />CARDS
                      </p>
                    </div>

                    {/* Card front */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: 10,
                        border: `1.5px solid ${config.border}`,
                        background: '#F0F0F0',
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: isLegendary
                          ? `0px 0px 20px ${config.border}60, 0px 4px 16px rgba(0,0,0,0.2)`
                          : `0px 4px 16px rgba(0,0,0,0.15), 0 0 12px ${config.border}40`,
                      }}
                    >
                      {/* Legendary shimmer overlay */}
                      {isLegendary && revealed && (
                        <div
                          className="legendary-shimmer"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 10,
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,200,0,0.12) 50%, transparent 80%)',
                            pointerEvents: 'none',
                            zIndex: 1,
                          }}
                        />
                      )}

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        <span style={{
                          background: config.badge,
                          color: config.badgeText,
                          fontSize: '5.5px',
                          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700,
                          padding: '2px 4px',
                          borderRadius: 8,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          backdropFilter: 'blur(4px)',
                        }}>
                          {card.rarity}
                        </span>
                        <span style={{
                          fontSize: '7.5px',
                          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700,
                          letterSpacing: '-0.04em',
                          color: '#414141',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {card.title}
                        </span>
                      </div>

                      {/* Image */}
                      <div style={{
                        background: card.imageUrl ? 'transparent' : '#DDAEE3',
                        borderRadius: 5,
                        border: '1.5px solid #D6D3D3',
                        flex: 1,
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        {card.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '6.5px',
                        fontFamily: 'var(--font-courier-prime), monospace',
                        color: card.flavourText ? '#414141' : '#AFAFAF',
                        margin: 0,
                        lineHeight: 1.35,
                        fontStyle: card.flavourText ? 'normal' : 'italic',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {card.flavourText || 'No description'}
                      </p>

                      {/* Footer */}
                      {(card.frequency || card.timeEstimate) && (
                        <div style={{
                          fontSize: '5.5px',
                          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          color: '#898383',
                          display: 'flex',
                          gap: 4,
                        }}>
                          {card.frequency && <span>{card.frequency}</span>}
                          {card.frequency && card.timeEstimate && <span>·</span>}
                          {card.timeEstimate && <span>{card.timeEstimate}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Done summary */}
          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2 flex-wrap justify-center">
                {cards.map((card, i) => {
                  const colors: Record<string, string> = {
                    COMMON: '#CCCCCC', UNCOMMON: '#00FF66', RARE: '#6E00FF', LEGENDARY: '#FF9E16',
                  };
                  return (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        background: colors[card.rarity] + '30',
                        border: `1px solid ${colors[card.rarity]}`,
                        color: '#414141',
                        fontFamily: 'var(--font-courier-prime), monospace',
                      }}
                    >
                      {card.title}
                    </span>
                  );
                })}
              </div>
              <p
                className="text-xs text-[#AFAFAF] text-center"
                style={{ fontFamily: 'var(--font-courier-prime), monospace' }}
              >
                Good luck with your chores ✌️
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
