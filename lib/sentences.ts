// lib/sentences.ts — Template-based sentence generator for rink summaries.
// Uses signal values, counts, stddev, and top tip text to produce
// natural-language verdicts. No AI needed — just interpolation.

import { SIGNAL_META } from './constants';
import type { Signal } from './rinkTypes';

interface SentenceTip {
  text: string;
  contributor_type: string;
}

interface SentenceInput {
  signals: Signal[];
  tips: SentenceTip[];
  contributionCount: number;
  rinkName: string;
  verdict: string;
  lastUpdatedAt: string | null;
  confirmedThisSeason: boolean;
}

// ── Signal description helpers ──

function signalDescriptor(signal: string, value: number): string {
  const meta = SIGNAL_META[signal];
  if (!meta) return '';

  if (value >= 4.0) return meta.highLabel.toLowerCase();
  if (value <= 2.0) return meta.lowLabel.toLowerCase();
  return 'okay';
}

function signalSentence(s: Signal): string {
  const meta = SIGNAL_META[s.signal];
  if (!meta || s.count === 0) return '';

  const descriptor = signalDescriptor(s.signal, s.value);
  const parentLabel = s.count === 1 ? 'parent' : 'parents';

  switch (s.signal) {
    case 'parking':
      if (s.value >= 3.5) return `Parking is ${descriptor} here (${s.value.toFixed(1)} from ${s.count} ${parentLabel}).`;
      if (s.value >= 2.5) return `Parking can be tight (${s.value.toFixed(1)} from ${s.count} ${parentLabel}).`;
      return `Heads up — parking is ${descriptor} (${s.value.toFixed(1)} from ${s.count} ${parentLabel}).`;

    case 'cold':
      if (s.value >= 3.5) return `Comfortable viewing — the arena runs warm.`;
      if (s.value >= 2.5) return `It can get cold — bring a mid layer.`;
      return `Bring extra layers — it runs cold in here.`;

    case 'food_nearby':
      if (s.value >= 3.5) return `Plenty of food options nearby.`;
      if (s.value >= 2.5) return `Some food options within driving distance.`;
      return `Not much food nearby — pack snacks.`;

    case 'chaos':
      if (s.value >= 3.5) return `Well-organized facility — easy to navigate.`;
      if (s.value >= 2.5) return `Can get a bit hectic during busy times.`;
      return `Expect some chaos — the layout can be confusing.`;

    case 'family_friendly':
      if (s.value >= 3.5) return `Great for families with younger kids.`;
      if (s.value >= 2.5) return `Decent for families, could be better.`;
      return `Not the most family-friendly setup.`;

    case 'locker_rooms':
      if (s.value >= 3.5) return `Spacious locker rooms with room for bags.`;
      if (s.value >= 2.5) return `Locker rooms are adequate.`;
      return `Locker rooms run tight — arrive early.`;

    case 'pro_shop':
      if (s.value >= 3.5) return `Well-stocked pro shop on site.`;
      if (s.value >= 2.5) return `Basic pro shop available.`;
      return `Pro shop is sparse — bring your own tape and laces.`;

    default:
      return `${meta.label}: ${s.value.toFixed(1)}/5.`;
  }
}

// ── Consensus commentary ──

function consensusNote(s: Signal): string {
  if (!s.stddev || s.count < 3) return '';
  if (s.stddev > 1.2) return ' (opinions vary widely)';
  if (s.stddev < 0.5 && s.count >= 5) return ' (parents agree)';
  return '';
}

// ── Main generators ──

/** Generate a 2-4 sentence summary for a rink. */
export function generateSummary(input: SentenceInput): string {
  const { signals, tips, contributionCount, verdict } = input;
  const rated = signals.filter(s => s.count > 0);
  if (rated.length === 0) return 'No reports yet — be the first to rate this rink.';

  const sentences: string[] = [];

  // Lead with verdict framing
  if (verdict.includes('Good')) {
    sentences.push(`Parents give this rink good marks overall.`);
  } else if (verdict.includes('Mixed')) {
    sentences.push(`Reviews are mixed — some things shine, others need work.`);
  } else if (verdict.includes('Heads up')) {
    sentences.push(`Heads up — parents have flagged some issues here.`);
  }

  // Pick the top 2-3 most notable signals (highest and lowest rated, with enough data)
  const notable = [...rated]
    .filter(s => s.count >= 2)
    .sort((a, b) => Math.abs(b.value - 3) - Math.abs(a.value - 3));

  const used = new Set<string>();
  for (const s of notable.slice(0, 3)) {
    const sentence = signalSentence(s);
    if (sentence && !used.has(s.signal)) {
      sentences.push(sentence + consensusNote(s));
      used.add(s.signal);
    }
  }

  // Add top tip if available and not redundant
  if (tips.length > 0 && sentences.length < 4) {
    const tipText = tips[0].text;
    if (tipText.length <= 100) {
      sentences.push(`Tip: "${tipText}"`);
    }
  }

  return sentences.slice(0, 4).join(' ');
}

/** Generate a short team briefing for the trip page (3-4 sentences). */
export function generateBriefing(input: SentenceInput): string {
  const { signals, tips, rinkName } = input;
  const rated = signals.filter(s => s.count > 0);
  if (rated.length === 0) return `No reports yet for ${rinkName}.`;

  const sentences: string[] = [];
  sentences.push(`Here's what hockey parents report about ${rinkName}:`);

  // Parking always first if available
  const parking = rated.find(s => s.signal === 'parking');
  if (parking) {
    sentences.push(signalSentence(parking));
  }

  // Cold/comfort next
  const cold = rated.find(s => s.signal === 'cold');
  if (cold) {
    sentences.push(signalSentence(cold));
  }

  // Best non-parking/cold signal
  const others = rated
    .filter(s => s.signal !== 'parking' && s.signal !== 'cold' && s.count >= 2)
    .sort((a, b) => b.value - a.value);
  if (others.length > 0) {
    sentences.push(signalSentence(others[0]));
  }

  // Add a tip if we have room
  if (tips.length > 0 && sentences.length < 5) {
    sentences.push(`Tip: "${tips[0].text}"`);
  }

  return sentences.slice(0, 5).join(' ');
}

/** Generate a single-signal sentence for inline comparisons. */
export function signalComparison(
  signal: string,
  rinkValue: number,
  rinkCount: number,
  userAvg: number,
): string {
  const meta = SIGNAL_META[signal];
  if (!meta || rinkCount === 0) return '';

  const diff = rinkValue - userAvg;
  const label = meta.label.toLowerCase();

  if (Math.abs(diff) < 0.3) {
    return `${meta.label} here is similar to your average (${rinkValue.toFixed(1)}).`;
  }
  if (diff > 0) {
    return `${meta.label} here: ${rinkValue.toFixed(1)} — better than your average of ${userAvg.toFixed(1)}.`;
  }
  return `${meta.label} here: ${rinkValue.toFixed(1)} — below your usual ${userAvg.toFixed(1)}.`;
}
