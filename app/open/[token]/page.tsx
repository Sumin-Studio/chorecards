'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getPack } from '@/app/lib/store';
import { ChoreCardData, rarityConfig } from '@/app/components/ChoreCard';

type Phase = 'loading' | 'sealed' | 'opening' | 'revealing' | 'done' | 'expired';

// Jagged tear clip-paths at ~15% from top
const TOP_CLIP  = 'polygon(0% 0%, 100% 0%, 100% 17%, 91% 13%, 83% 18%, 74% 12%, 66% 17%, 58% 13%, 50% 18%, 42% 13%, 33% 17%, 25% 12%, 17% 17%, 8% 13%, 0% 17%)';
const BODY_CLIP = 'polygon(0% 17%, 8% 13%, 17% 17%, 25% 12%, 33% 17%, 42% 13%, 50% 18%, 58% 13%, 66% 17%, 74% 12%, 83% 18%, 91% 13%, 100% 17%, 100% 100%, 0% 100%)';

const PACK_W = 180;
const PACK_H = 265;

const rarityGlow: Record<string, string> = {
  COMMON:    'rgba(200,200,200,0.5)',
  UNCOMMON:  'rgba(0,255,102,0.5)',
  RARE:      'rgba(110,0,255,0.5)',
  LEGENDARY: 'rgba(255,158,22,0.6)',
};

export default function OpenPackPage() {
  const { token } = useParams<{ token: string }>();
  const [cards, setCards]           = useState<ChoreCardData[]>([]);
  const [phase, setPhase]           = useState<Phase>('loading');
  const [cardsIn, setCardsIn]       = useState(false);
  const [revealed, setRevealed]     = useState<boolean[]>([]);

  useEffect(() => {
    getPack(token).then((result) => {
      if (!result?.length) { setPhase('expired'); return; }
      setCards(result);
      setRevealed(new Array(result.length).fill(false));
      setPhase('sealed');
    });
  }, [token]);

  function handleOpen() {
    setPhase('opening');

    // 1. Tear animation plays (0–650ms)
    // 2. Cards slide into view (700ms)
    const slideIn = 700;
    setTimeout(() => setCardsIn(true), slideIn);

    // 3. Start flipping cards one by one (after cards fully slid in)
    const flipStart = slideIn + cards.length * 130 + 500;
    setTimeout(() => setPhase('revealing'), flipStart);

    cards.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => prev.map((v, idx) => (idx === i ? true : v)));
      }, flipStart + i * 750);
    });

    // 4. Done
    setTimeout(() => setPhase('done'), flipStart + cards.length * 750 + 500);
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
        <h1 style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.06em', color: '#414141', fontSize: 28 }}>
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
    <div className="graph-paper min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-16 overflow-hidden">

      {/* CHOREPACKER wordmark */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontWeight: 700,
          letterSpacing: '-0.06em',
          fontSize: 13,
          color: '#AFAFAF',
        }}
      >
        CHOREPACKER
      </motion.p>

      {/* Pack + cards area */}
      <div className="flex flex-col items-center gap-8">

        {/* ── The foil pack ── */}
        <AnimatePresence>
          {(phase === 'sealed' || phase === 'opening') && (
            <div style={{ position: 'relative', width: PACK_W, height: PACK_H }}>

              {/* TOP FLAP — tears away */}
              <motion.div
                initial={{ y: 0, rotate: 0, opacity: 1 }}
                animate={phase === 'opening'
                  ? { y: -180, rotate: -12, x: 20, opacity: 0 }
                  : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: TOP_CLIP,
                  background: 'linear-gradient(160deg, #3a3a3a 0%, #686868 30%, #4a4a4a 55%, #7a7a7a 75%, #3a3a3a 100%)',
                  borderRadius: 12,
                  transformOrigin: 'bottom center',
                  zIndex: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Foil shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
                    pointerEvents: 'none',
                  }}
                />
              </motion.div>

              {/* PACK BODY — stays then fades */}
              <motion.div
                animate={phase === 'opening' ? { opacity: 0, y: 20, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: phase === 'opening' ? 0.45 : 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: BODY_CLIP,
                  background: 'linear-gradient(160deg, #3a3a3a 0%, #686868 30%, #4a4a4a 55%, #7a7a7a 75%, #3a3a3a 100%)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  overflow: 'hidden',
                }}
              >
                {/* Foil shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.3, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Pack label */}
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <p style={{
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.2,
                  }}>
                    CHORE<br />CARDS
                  </p>
                </div>
                <div style={{
                  width: 60, height: 1,
                  background: 'rgba(255,255,255,0.2)',
                }}/>
                <p style={{
                  fontFamily: 'var(--font-courier-prime), monospace',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.04em',
                }}>
                  {cards.length} cards inside
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Cards row (slides in after rip) ── */}
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
                    initial={{ y: 80, opacity: 0, rotateY: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.13, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ perspective: 1000 }}
                  >
                    {/* Flip container */}
                    <motion.div
                      animate={{ rotateY: isRevealed ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        width: 140,
                        height: 192,
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Card back */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: 10,
                        background: 'linear-gradient(160deg, #3a3a3a 0%, #686868 30%, #4a4a4a 55%, #7a7a7a 75%, #3a3a3a 100%)',
                        boxShadow: '0px 4px 20px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut', delay: i * 0.3 }}
                          style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.12) 50%, transparent 80%)',
                          }}
                        />
                        <p style={{
                          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                          fontWeight: 700, fontSize: 9,
                          color: 'rgba(255,255,255,0.55)',
                          letterSpacing: '-0.04em',
                          textAlign: 'center', lineHeight: 1.4,
                          zIndex: 1, position: 'relative',
                        }}>
                          CHORE<br />CARDS
                        </p>
                      </div>

                      {/* Card front */}
                      <motion.div
                        style={{
                          position: 'absolute', inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          borderRadius: 10,
                          border: `1.5px solid ${config.border}`,
                          background: '#F0F0F0',
                          padding: 9,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
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
                              background: 'linear-gradient(105deg, transparent 20%, rgba(255,200,50,0.2) 50%, transparent 80%)',
                              pointerEvents: 'none', zIndex: 1,
                            }}
                          />
                        )}

                        {/* Header */}
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

        {/* ── Done summary ── */}
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
      </div>

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
