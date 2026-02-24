'use client';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface ChoreCardData {
  id?: string;
  title: string;
  rarity: Rarity;
  flavourText: string;
  timeEstimate?: string;
  frequency?: string;
  imageUrl?: string;
}

export const rarityConfig: Record<Rarity, {
  border: string;
  badge: string;
  badgeText: string;
  label: string;
}> = {
  COMMON: {
    border: '#CCCCCC',
    badge: 'rgba(200,200,200,0.85)',
    badgeText: '#555555',
    label: 'COMMON',
  },
  UNCOMMON: {
    border: '#00FF66',
    badge: 'rgba(0,255,102,0.55)',
    badgeText: '#044819',
    label: 'UNCOMMON',
  },
  RARE: {
    border: '#6E00FF',
    badge: 'rgba(110,0,255,0.55)',
    badgeText: '#FFFFFF',
    label: 'RARE',
  },
  LEGENDARY: {
    border: '#FF9E16',
    badge: 'rgba(255,158,22,0.55)',
    badgeText: '#333333',
    label: 'LEGENDARY',
  },
};

type CardSize = 'sm' | 'md' | 'lg';

const sizes: Record<CardSize, {
  width: number; height: number;
  titleSize: string; badgeSize: string; bodySize: string;
  gap: string; padding: string;
  radius: string; borderWidth: string;
  badgePad: string; badgeRadius: string;
  imgFlex: number;
}> = {
  sm: {
    width: 140, height: 190,
    titleSize: '6.5px', badgeSize: '4.5px', bodySize: '5.8px',
    gap: '5px', padding: '7px',
    radius: '8px', borderWidth: '1px',
    badgePad: '1.5px 4px', badgeRadius: '8px',
    imgFlex: 1,
  },
  md: {
    width: 229, height: 310,
    titleSize: '10.9px', badgeSize: '7.5px', bodySize: '9.5px',
    gap: '8px', padding: '12px',
    radius: '12px', borderWidth: '1.2px',
    badgePad: '3px 6px', badgeRadius: '13px',
    imgFlex: 1,
  },
  lg: {
    width: 270, height: 370,
    titleSize: '13px', badgeSize: '9px', bodySize: '11.5px',
    gap: '9px', padding: '14px',
    radius: '14px', borderWidth: '1.5px',
    badgePad: '3.5px 8px', badgeRadius: '16px',
    imgFlex: 1,
  },
};

interface ChoreCardProps {
  card: ChoreCardData;
  size?: CardSize;
  hero?: boolean;
  onImageClick?: () => void;
}

export default function ChoreCard({ card, size = 'md', hero = false, onImageClick }: ChoreCardProps) {
  const config = rarityConfig[card.rarity];
  const dim = sizes[size];

  const shadow = hero
    ? `0px 8px 18px rgba(0,0,0,0.38), 0px 33px 33px rgba(0,0,0,0.28), 0px 74px 44px rgba(0,0,0,0.16)`
    : `0px 1px 2.1px rgba(0,0,0,0.10), 1.6px 3.6px 4.2px rgba(0,0,0,0.09), 3.6px 8.3px 5.2px rgba(0,0,0,0.05)`;

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        borderRadius: dim.radius,
        border: `${dim.borderWidth} solid ${config.border}`,
        background: '#F0F0F0',
        padding: dim.padding,
        display: 'flex',
        flexDirection: 'column',
        gap: dim.gap,
        boxShadow: shadow,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header: rarity badge + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flexShrink: 0 }}>
        <span
          style={{
            background: config.badge,
            color: config.badgeText,
            fontSize: dim.badgeSize,
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.02em',
            padding: dim.badgePad,
            borderRadius: dim.badgeRadius,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: `inset 0px 1.5px 1.5px rgba(255,255,255,0.45), inset 0px -1px 1px rgba(255,255,255,0.6)`,
            flexShrink: 0,
          }}
        >
          {config.label}
        </span>
        <span
          style={{
            fontSize: dim.titleSize,
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: card.title ? '#414141' : '#CFCFCF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {card.title || 'Name your card'}
        </span>
      </div>

      {/* Image area */}
      <div
        onClick={onImageClick}
        style={{
          background: card.imageUrl ? 'transparent' : '#DDAEE3',
          borderRadius: '6px',
          border: '2px solid #D6D3D3',
          overflow: 'hidden',
          flex: dim.imgFlex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: onImageClick ? 'pointer' : 'default',
        }}
      >
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          onImageClick && (
            <span
              style={{
                fontSize: dim.badgeSize,
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              Upload image +
            </span>
          )
        )}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: dim.bodySize,
          fontFamily: 'var(--font-courier-prime), "Courier New", Courier, monospace',
          fontWeight: 400,
          color: card.flavourText ? '#414141' : '#AFAFAF',
          margin: 0,
          lineHeight: 1.35,
          flexShrink: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          fontStyle: card.flavourText ? 'normal' : 'italic',
        }}
      >
        {card.flavourText || 'What do ya gotta do'}
      </p>
    </div>
  );
}
