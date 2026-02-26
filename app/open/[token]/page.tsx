'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getPack } from '@/app/lib/store';
import { ChoreCardData, rarityConfig } from '@/app/components/ChoreCard';

// Dynamically import the 3D scene (Three.js can't run on server)
const PackScene = dynamic(() => import('./PackScene'), { ssr: false });

type Phase = 'loading' | 'sealed' | 'opening' | 'revealing' | 'done' | 'expired';

const rarityGlow: Record<string, string> = {
  COMMON:    'rgba(200,200,200,0.5)',
  UNCOMMON:  'rgba(0,255,102,0.5)',
  RARE:      'rgba(110,0,255,0.5)',
  LEGENDARY: 'rgba(255,158,22,0.6)',
};

export default function OpenPackPage() {
  const { token } = useParams<{ token: string }>();
  const [cards, setCards]       = useState<ChoreCardData[]>([]);
  const [phase, setPhase]       = useState<Phase>('loading');
  const [cardsIn, setCardsIn]   = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>([]);

  useEffect(() => {
    getPack(token).then((result) => {
      if (!result?.length) { setPhase('expired'); return; }
      setCards(result);
      setRevealed(new Array(result.length).fill(false));
      setPhase('sealed');
    });
  }, [token]);

  // Derive pack3dState for the 3D scene
  const pack3dState: 'sealed' | 'opening' | 'opened' =
    phase === 'sealed' ? 'sealed' :
    phase === 'opening' ? 'opening' : 'opened';

  // Called when the 3D tear animation finishes
  function handleOpenComplete() {
    // Slide cards in
    setCardsIn(true);

    // Start revealing one by one after slide-in completes
    const revealStart = cards.length * 140 + 400;
    setTimeout(() => setPhase('revealing'), revealStart);

    cards.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => prev.map((v, idx) => (idx === i ? true : v)));
      }, revealStart + i * 700);
    });

    setTimeout(() => setPhase('done'), revealStart + cards.length * 700 + 500);
  }

  function handleOpen() {
    setPhase('opening');
  }

  /* ── LOADING ── */
  if (phase === 'loading') {
    return (
      <div className="graph-paper min-h-screen flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#AFAFAF' }}>
          Loading pack...
        </p>
      </div>
    );
  }

  /* ── EXPIRED ── */
  if (phase === 'expired') {
    return (
      <div className="graph-paper min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-4xl">📦</p>
        <h1 style={{
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontWeight: 700, letterSpacing: '-0.06em', color: '#414141', fontSize: 28,
        }}>
          Pack expired
        </h1>
        <p style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#AFAFAF', fontSize: 14 }}>
          This link has expired or doesn&apos;t exist. Ask your flatmate to generate a new one.
        </p>
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="graph-paper min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-16 overflow-hidden">

      {/* Wordmark */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontWeight: 700, letterSpacing: '-0.06em',
          fontSize: 13, color: '#AFAFAF',
        }}
      >
        CHOREPACKER
      </motion.p>

      {/* 3D Pack */}
      <AnimatePresence>
        {(phase === 'sealed' || phase === 'opening') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 260, height: 380 }}
          >
            <PackScene
              packState={pack3dState}
              onOpenComplete={handleOpenComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards row */}
      <AnimatePresence>
        {cardsIn && (
          <div className="flex flex-wrap justify-center gap-4">
            {cards.map((card, i) => {
              const config = rarityConfig[card.rarity];
              const isRevealed = revealed[i];
              const isLegendary = card.rarity === 'LEGENDARY';

              return (
                <motion.div
                  key={i}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.13, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ perspective: 1000 }}
                >
                  {/* Flip container */}
                  <motion.div
                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                    transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      width: 140, height: 192, position: 'relative',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Card back */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                      borderRadius: 10,
                      background: 'linear-gradient(160deg, #1a1a2e 0%, #2a2a3a 30%, #16213e 55%, #1a1a2e 80%, #0f0f1a 100%)',
                      boxShadow: '0px 4px 24px rgba(0,0,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {/* Rainbow foil sheen */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut', delay: i * 0.4 }}
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(105deg, transparent 15%, rgba(255,100,200,0.15) 30%, rgba(100,200,255,0.15) 50%, rgba(200,255,100,0.12) 70%, transparent 85%)',
                        }}
                      />
                      <p style={{
                        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                        fontWeight: 700, fontSize: 9,
                        color: 'rgba(255,255,255,0.55)',
                        letterSpacing: '-0.04em', textAlign: 'center', lineHeight: 1.4,
                        zIndex: 1, position: 'relative',
                      }}>
                        CHORE<br />CARDS
                      </p>
                    </div>

                    {/* Card front */}
                    <motion.div
                      style={{
                        position: 'absolute', inset: 0,
                        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: 10,
                        border: `1.5px solid ${config.border}`,
                        background: '#F0F0F0',
                        padding: 9,
                        display: 'flex', flexDirection: 'column', gap: 6,
                        boxShadow: isRevealed
                          ? `0 0 24px ${rarityGlow[card.rarity]}, 0 4px 16px rgba(0,0,0,0.15)`
                          : '0 4px 16px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Legendary shimmer */}
                      {isLegendary && isRevealed && (
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,200,50,0.22) 50%, transparent 80%)',
                            pointerEvents: 'none', zIndex: 1,
                          }}
                        />
                      )}

                      {/* Rarity + title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        <span style={{
                          background: config.badge, color: config.badgeText,
                          fontSize: '5.5px', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700, padding: '2px 4px', borderRadius: 7,
                          whiteSpace: 'nowrap', flexShrink: 0,
                          backdropFilter: 'blur(4px)',
                        }}>
                          {card.rarity}
                        </span>
                        <span style={{
                          fontSize: '7.5px', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700, letterSpacing: '-0.04em', color: '#414141',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        }}>
                          {card.title}
                        </span>
                      </div>

                      {/* Image */}
                      <div style={{
                        background: card.imageUrl ? 'transparent' : '#DDAEE3',
                        borderRadius: 5, border: '1.5px solid #D6D3D3',
                        flex: 1, overflow: 'hidden', position: 'relative',
                      }}>
                        {card.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.imageUrl} alt={card.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '6.5px',
                        fontFamily: 'var(--font-courier-prime), monospace',
                        color: card.flavourText ? '#414141' : '#AFAFAF',
                        margin: 0, lineHeight: 1.35,
                        fontStyle: card.flavourText ? 'normal' : 'italic',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {card.flavourText || 'No description'}
                      </p>

                      {(card.frequency || card.timeEstimate) && (
                        <div style={{
                          fontSize: '5.5px', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          color: '#898383', display: 'flex', gap: 4,
                        }}>
                          {card.frequency && <span>{card.frequency}</span>}
                          {card.frequency && card.timeEstimate && <span>·</span>}
                          {card.timeEstimate && <span>{card.timeEstimate}</span>}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Legendary label */}
                  <AnimatePresence>
                    {isLegendary && isRevealed && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          textAlign: 'center', marginTop: 6,
                          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700, fontSize: 9,
                          color: '#FF9E16', letterSpacing: '0.06em',
                        }}
                      >
                        LEGENDARY ✦
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Done summary */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <p style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: 700, letterSpacing: '-0.05em',
              fontSize: 22, color: '#414141',
            }}>
              Your chores 👑
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {cards.map((card, i) => {
                const colors: Record<string, string> = {
                  COMMON: '#CCCCCC', UNCOMMON: '#00FF66', RARE: '#6E00FF', LEGENDARY: '#FF9E16',
                };
                return (
                  <span key={i} style={{
                    background: colors[card.rarity] + '25',
                    border: `1px solid ${colors[card.rarity]}`,
                    borderRadius: 20, padding: '3px 10px',
                    fontFamily: 'var(--font-courier-prime), monospace',
                    fontSize: 12, color: '#414141',
                  }}>
                    {card.title}
                  </span>
                );
              })}
            </div>
            <p style={{ fontFamily: 'var(--font-courier-prime), monospace', fontSize: 12, color: '#CFCFCF' }}>
              Good luck ✌️
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open button */}
      <AnimatePresence>
        {phase === 'sealed' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleOpen}
            className="btn-primary px-12 py-4 text-base"
          >
            Open pack →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Revealing hint */}
      <AnimatePresence>
        {phase === 'revealing' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontFamily: 'var(--font-courier-prime), monospace', fontSize: 12, color: '#CFCFCF' }}
          >
            Revealing your cards...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
