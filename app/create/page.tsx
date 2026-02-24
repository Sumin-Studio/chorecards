'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChoreCard, { ChoreCardData, Rarity, rarityConfig } from '@/app/components/ChoreCard';
import { saveCard, getCards, RARITIES } from '@/app/lib/store';

const defaultCard: ChoreCardData = {
  title: '',
  rarity: 'COMMON',
  flavourText: '',
  timeEstimate: '',
  frequency: '',
  imageUrl: '',
};

function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [card, setCard] = useState<ChoreCardData>({ ...defaultCard });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      getCards().then((cards) => {
        const existing = cards.find((c) => c.id === editId);
        if (existing) setCard(existing);
      });
    }
  }, [editId]);

  function update(field: keyof ChoreCardData, value: string) {
    setCard((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update('imageUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!card.title.trim()) return;
    setSaving(true);
    try {
      await saveCard({ ...card });
      router.push('/');
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const canSave = card.title.trim().length > 0;

  return (
    <div className="flex h-screen overflow-hidden graph-paper">

      {/* ── Left Sidebar ── */}
      <aside
        className="flex flex-col shrink-0 h-full overflow-y-auto"
        style={{
          width: 260,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRight: '1px solid #C6C6C6',
        }}
      >
        {/* Back + title */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#898383] hover:text-[#414141] transition-colors mb-3 flex items-center gap-1"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
          >
            ← back
          </button>
          <h1
            className="text-2xl leading-tight"
            style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              color: '#414141',
            }}
          >
            CREATE<br />CARD
          </h1>
        </div>

        <div style={{ borderTop: '1px solid #C6C6C6' }} />

        {/* Form fields */}
        <div className="flex flex-col gap-5 px-6 py-5 flex-1">

          {/* Name */}
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                letterSpacing: '-0.04em',
                color: '#898383',
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. The Sacred Bin Run"
              className="w-full rounded-xl px-3 py-2 text-sm text-[#414141] placeholder-[#CFCFCF] focus:outline-none focus:border-[#414141]"
              style={{
                background: '#F0F0F0',
                border: '1px solid #D6D3D3',
                fontFamily: 'var(--font-courier-prime), monospace',
              }}
            />
          </div>

          {/* Image upload */}
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                letterSpacing: '-0.04em',
                color: '#898383',
              }}
            >
              Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
              style={{
                background: card.imageUrl ? 'transparent' : '#DDAEE3',
                border: '1px solid #D6D3D3',
                height: 130,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.imageUrl}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  className="text-sm"
                  style={{
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                  }}
                >
                  Upload image +
                </span>
              )}
            </button>
            {card.imageUrl && (
              <button
                onClick={() => update('imageUrl', '')}
                className="text-xs text-[#AFAFAF] hover:text-red-400 mt-1 transition-colors"
                style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
              >
                Remove image
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                letterSpacing: '-0.04em',
                color: '#898383',
              }}
            >
              Description
            </label>
            <textarea
              value={card.flavourText}
              onChange={(e) => update('flavourText', e.target.value)}
              placeholder="What do ya gotta do"
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm text-[#414141] placeholder-[#CFCFCF] focus:outline-none focus:border-[#414141] resize-none"
              style={{
                background: '#F0F0F0',
                border: '1px solid #D6D3D3',
                fontFamily: 'var(--font-courier-prime), monospace',
              }}
            />
          </div>

          {/* Rarity pills */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                letterSpacing: '-0.04em',
                color: '#898383',
              }}
            >
              Rarity
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RARITIES.map((r: Rarity) => {
                const cfg = rarityConfig[r];
                const selected = card.rarity === r;
                return (
                  <button
                    key={r}
                    onClick={() => update('rarity', r)}
                    style={{
                      background: selected ? cfg.badge : 'rgba(240,240,240,0.8)',
                      color: selected ? cfg.badgeText : '#898383',
                      border: selected ? `1px solid ${cfg.border}` : '1px solid #D6D3D3',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '10px',
                      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      backdropFilter: selected ? 'blur(4px)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional fields */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block text-xs mb-1.5"
                style={{
                  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                  letterSpacing: '-0.04em',
                  color: '#898383',
                }}
              >
                Frequency
              </label>
              <select
                value={card.frequency}
                onChange={(e) => update('frequency', e.target.value)}
                className="w-full rounded-xl px-2 py-2 text-xs text-[#414141] focus:outline-none"
                style={{
                  background: '#F0F0F0',
                  border: '1px solid #D6D3D3',
                  fontFamily: 'var(--font-courier-prime), monospace',
                }}
              >
                <option value="">—</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="One-off">One-off</option>
                <option value="As needed">As needed</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                className="block text-xs mb-1.5"
                style={{
                  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                  letterSpacing: '-0.04em',
                  color: '#898383',
                }}
              >
                Est. time
              </label>
              <input
                type="text"
                value={card.timeEstimate}
                onChange={(e) => update('timeEstimate', e.target.value)}
                placeholder="5 mins"
                className="w-full rounded-xl px-2 py-2 text-xs text-[#414141] placeholder-[#CFCFCF] focus:outline-none"
                style={{
                  background: '#F0F0F0',
                  border: '1px solid #D6D3D3',
                  fontFamily: 'var(--font-courier-prime), monospace',
                }}
              />
            </div>
          </div>
        </div>

        {/* Create button pinned to bottom */}
        <div className="px-6 pb-6 pt-3" style={{ borderTop: '1px solid #C6C6C6' }}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-primary w-full py-3.5 text-sm"
          >
            {saving ? 'Saving...' : editId ? 'Save changes' : 'Create'}
          </button>
        </div>
      </aside>

      {/* ── Main: Card preview ── */}
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <p
            className="text-xs uppercase tracking-widest"
            style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: 700,
              color: '#AFAFAF',
            }}
          >
            Preview
          </p>
          <ChoreCard
            card={card}
            size="lg"
            hero
            onImageClick={() => fileInputRef.current?.click()}
          />
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-courier-prime), monospace',
              color: '#CFCFCF',
            }}
          >
            {card.imageUrl ? 'Click the image to change it' : 'Click the image area to upload'}
          </p>
        </div>
      </main>
    </div>
  );
}

// fileInputRef can't be passed from Suspense boundary so we keep it inside CreateForm
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="graph-paper h-screen flex items-center justify-center">
        <span style={{ color: '#AFAFAF', fontFamily: 'var(--font-courier-prime), monospace' }}>
          Loading...
        </span>
      </div>
    }>
      <CreateForm />
    </Suspense>
  );
}
