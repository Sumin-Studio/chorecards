import { getSupabase } from './supabase';
import { ChoreCardData, Rarity } from '@/app/components/ChoreCard';

export const RARITIES: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'];

export const RARITY_ODDS: Record<Rarity, number> = {
  COMMON: 0.5,
  UNCOMMON: 0.3,
  RARE: 0.15,
  LEGENDARY: 0.05,
};

// ── Cards ──────────────────────────────────────────────

export async function getCards(): Promise<ChoreCardData[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbToCard);
}

export async function saveCard(card: ChoreCardData): Promise<ChoreCardData> {
  const sb = getSupabase();
  const row = cardToDb(card);
  if (card.id) {
    const { data, error } = await sb
      .from('cards')
      .update(row)
      .eq('id', card.id)
      .select()
      .single();
    if (error) throw error;
    return dbToCard(data);
  } else {
    const { data, error } = await sb
      .from('cards')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return dbToCard(data);
  }
}

export async function deleteCard(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('cards').delete().eq('id', id);
  if (error) throw error;
}

// ── Packs ──────────────────────────────────────────────

export async function createPack(cardIds: string[]): Promise<string> {
  const sb = getSupabase();
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await sb.from('packs').insert({
    token,
    card_ids: cardIds,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return token;
}

export async function getPack(token: string): Promise<ChoreCardData[] | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('packs')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !data) return null;

  const { data: cards, error: cardsError } = await sb
    .from('cards')
    .select('*')
    .in('id', data.card_ids);
  if (cardsError) return null;
  return (cards ?? []).map(dbToCard);
}

// ── Rarity-weighted draw ───────────────────────────────

export function drawCards(cards: ChoreCardData[], count: number): ChoreCardData[] {
  const drawn: ChoreCardData[] = [];
  for (let i = 0; i < count; i++) {
    drawn.push(weightedRandom(cards));
  }
  return drawn;
}

function weightedRandom(cards: ChoreCardData[]): ChoreCardData {
  const total = cards.reduce((s, c) => s + RARITY_ODDS[c.rarity], 0);
  let rand = Math.random() * total;
  for (const card of cards) {
    rand -= RARITY_ODDS[card.rarity];
    if (rand <= 0) return card;
  }
  return cards[cards.length - 1];
}

// ── Mapping helpers ────────────────────────────────────

function dbToCard(row: Record<string, unknown>): ChoreCardData {
  return {
    id: row.id as string,
    title: row.title as string,
    rarity: row.rarity as Rarity,
    flavourText: (row.flavour_text ?? '') as string,
    timeEstimate: (row.time_estimate ?? '') as string,
    frequency: (row.frequency ?? '') as string,
    imageUrl: (row.image_url ?? '') as string,
  };
}

function cardToDb(card: ChoreCardData): Record<string, unknown> {
  return {
    title: card.title,
    rarity: card.rarity,
    flavour_text: card.flavourText,
    time_estimate: card.timeEstimate,
    frequency: card.frequency,
    image_url: card.imageUrl,
  };
}
