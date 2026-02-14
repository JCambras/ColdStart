// vibe.ts — ColdStart Behavioral Archetype Engine
// Logs user events, classifies into archetypes, and exposes hooks
// for adaptive UI. Stores everything in localStorage — no backend needed yet.
//
// Archetypes:
//   organizer  — creates trips, fills fields, shares links
//   scout      — views multiple rinks, reads deeply, compares
//   contributor — rates signals, drops tips, votes
//   glancer    — arrives via shared link, <60s sessions, single page
//   anxious    — repeat visits to same rink, high tip read depth
//
// Usage:
//   import { vibe } from './vibe';
//   vibe.log('rink_page_view', { rinkId: 'ice-line', scrollDepth: 0.8 });
//   const archetype = vibe.classify(); // 'scout'
//   const isGlancer = vibe.is('glancer');

// ── Types ──

interface VibeEvent {
  type: string;
  ts: number;
  data?: Record<string, any>;
}

interface VibeSession {
  id: string;
  start: number;
  end: number;
  events: VibeEvent[];
  pages: string[];
  entrySource: 'direct' | 'shared_link' | 'search' | 'internal';
}

interface VibeProfile {
  sessions: VibeSession[];
  archetype: string | null;
  scores: Record<string, number>;
  lastClassified: number;
  rinkViews: Record<string, number>; // rinkId -> view count
  contributions: number;
  tripsCreated: number;
  tripsShared: number;
  tipExpands: number;
  signalExpands: number;
  uniqueRinksViewed: number;
}

type Archetype = 'organizer' | 'scout' | 'contributor' | 'glancer' | 'anxious' | 'unknown';

// ── Constants ──

const STORAGE_KEY = 'coldstart_vibe';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MIN_SESSIONS_TO_CLASSIFY = 2;

// ── Helper ──

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now(): number {
  return Date.now();
}

// ── Core Engine ──

class VibeEngine {
  private profile: VibeProfile;
  private currentSession: VibeSession;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.profile = this.load();
    this.currentSession = this.startSession();
  }

  // ── Storage ──

  private load(): VibeProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Keep only last 50 sessions to avoid bloat
        if (parsed.sessions?.length > 50) {
          parsed.sessions = parsed.sessions.slice(-50);
        }
        return parsed;
      }
    } catch {}
    return {
      sessions: [],
      archetype: null,
      scores: {},
      lastClassified: 0,
      rinkViews: {},
      contributions: 0,
      tripsCreated: 0,
      tripsShared: 0,
      tipExpands: 0,
      signalExpands: 0,
      uniqueRinksViewed: 0,
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {}
  }

  // ── Session Management ──

  private startSession(): VibeSession {
    // Detect entry source
    let entrySource: VibeSession['entrySource'] = 'direct';
    if (typeof window !== 'undefined') {
      const ref = document.referrer;
      const path = window.location.pathname;
      const search = window.location.search;

      if (path.startsWith('/trip/') && !ref.includes(window.location.host)) {
        entrySource = 'shared_link';
      } else if (ref.includes(window.location.host)) {
        entrySource = 'internal';
      } else if (search.includes('q=') || search.includes('query=')) {
        entrySource = 'search';
      }
    }

    const session: VibeSession = {
      id: generateId(),
      start: now(),
      end: now(),
      events: [],
      pages: [],
      entrySource,
    };

    return session;
  }

  private closeSession(): void {
    if (this.currentSession.events.length > 0) {
      this.currentSession.end = now();
      this.profile.sessions.push(this.currentSession);

      // Reclassify if enough data
      if (this.profile.sessions.length >= MIN_SESSIONS_TO_CLASSIFY) {
        this.classify();
      }

      this.save();
    }
  }

  private touchSession(): void {
    this.currentSession.end = now();

    // Reset inactivity timer
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = setTimeout(() => {
      this.closeSession();
      this.currentSession = this.startSession();
    }, SESSION_TIMEOUT);
  }

  // ── Event Logging ──

  log(type: string, data?: Record<string, any>): void {
    const event: VibeEvent = { type, ts: now(), data };
    this.currentSession.events.push(event);
    this.touchSession();

    // Track page visits
    if (type === 'page_view' && data?.path) {
      if (!this.currentSession.pages.includes(data.path)) {
        this.currentSession.pages.push(data.path);
      }
    }

    // Update aggregate counters
    switch (type) {
      case 'rink_page_view':
        if (data?.rinkId) {
          this.profile.rinkViews[data.rinkId] = (this.profile.rinkViews[data.rinkId] || 0) + 1;
          this.profile.uniqueRinksViewed = Object.keys(this.profile.rinkViews).length;
        }
        break;
      case 'contribution_submit':
        this.profile.contributions++;
        break;
      case 'trip_create':
        this.profile.tripsCreated++;
        break;
      case 'trip_share':
        this.profile.tripsShared++;
        break;
      case 'tip_expand':
        this.profile.tipExpands++;
        break;
      case 'signal_expand':
        this.profile.signalExpands++;
        break;
    }

    this.save();
  }

  // ── Classification ──

  classify(): Archetype {
    const p = this.profile;
    const sessions = p.sessions;
    if (sessions.length < MIN_SESSIONS_TO_CLASSIFY) {
      p.archetype = 'unknown';
      return 'unknown';
    }

    // Calculate session metrics
    const durations = sessions.map(s => s.end - s.start);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const shortSessions = durations.filter(d => d < 60000).length; // under 60s
    const shortRatio = shortSessions / sessions.length;

    const allPages = sessions.flatMap(s => s.pages);
    const avgPagesPerSession = allPages.length / sessions.length;

    // Count rinks viewed more than once (anxiety signal)
    const repeatRinks = Object.values(p.rinkViews).filter(v => v >= 3).length;

    // Shared link entries
    const sharedEntries = sessions.filter(s => s.entrySource === 'shared_link').length;
    const sharedRatio = sharedEntries / sessions.length;

    // ── Score each archetype ──

    const scores: Record<Archetype, number> = {
      organizer: 0,
      scout: 0,
      contributor: 0,
      glancer: 0,
      anxious: 0,
      unknown: 0,
    };

    // Organizer: creates trips, shares, fills fields
    scores.organizer =
      p.tripsCreated * 5 +
      p.tripsShared * 4 +
      (avgDuration > 180000 ? 3 : 0); // >3 min sessions

    // Scout: views many rinks, reads deeply
    scores.scout =
      p.uniqueRinksViewed * 3 +
      p.tipExpands * 1 +
      p.signalExpands * 1 +
      (avgPagesPerSession > 3 ? 4 : 0);

    // Contributor: submits ratings, tips, votes
    scores.contributor =
      p.contributions * 5 +
      p.tipExpands * 0.5;

    // Glancer: short sessions, single page, arrives via shared link
    scores.glancer =
      shortRatio * 10 +
      sharedRatio * 8 +
      (avgPagesPerSession < 2 ? 5 : 0) +
      (avgDuration < 60000 ? 5 : 0);

    // Anxious: repeat visits to same rink, high tip read depth
    scores.anxious =
      repeatRinks * 5 +
      p.tipExpands * 2 +
      (p.uniqueRinksViewed <= 2 && p.tipExpands > 5 ? 5 : 0);

    // Find winner
    let maxScore = 0;
    let winner: Archetype = 'unknown';
    for (const [arch, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = arch as Archetype;
      }
    }

    // Need minimum signal to classify
    if (maxScore < 5) winner = 'unknown';

    p.archetype = winner;
    p.scores = scores;
    p.lastClassified = now();
    this.save();

    return winner;
  }

  // ── Query Methods ──

  /** Current archetype */
  get archetype(): Archetype {
    return (this.profile.archetype as Archetype) || 'unknown';
  }

  /** Check if user matches a specific archetype */
  is(arch: Archetype): boolean {
    return this.archetype === arch;
  }

  /** Is this a glancer who arrived via shared link? */
  get isSharedLinkGlancer(): boolean {
    return this.currentSession.entrySource === 'shared_link';
  }

  /** How many times has this user viewed a specific rink? */
  rinkViewCount(rinkId: string): number {
    return this.profile.rinkViews[rinkId] || 0;
  }

  /** Is this user repeatedly visiting the same rink (anxiety signal)? */
  isAnxiousAbout(rinkId: string): boolean {
    return (this.profile.rinkViews[rinkId] || 0) >= 3;
  }

  /** Total sessions */
  get sessionCount(): number {
    return this.profile.sessions.length;
  }

  /** Total contributions */
  get contributionCount(): number {
    return this.profile.contributions;
  }

  /** Get all scores for debugging/display */
  get allScores(): Record<string, number> {
    return { ...this.profile.scores };
  }

  /** Is this likely a first-time visitor? */
  get isFirstVisit(): boolean {
    return this.profile.sessions.length <= 1;
  }

  /** Get the right CTA for this user's vibe */
  get suggestedCTA(): { text: string; action: string; icon: string } {
    switch (this.archetype) {
      case 'organizer':
        return { text: 'Plan your next trip', action: '/trip/new', icon: '📋' };
      case 'scout':
        return { text: 'Compare rinks', action: '/compare', icon: '⚖️' };
      case 'contributor':
        return { text: 'Rate another rink', action: '/', icon: '📊' };
      case 'anxious':
        return { text: "You're all set — here's your checklist", action: '#checklist', icon: '✅' };
      case 'glancer':
      default:
        return { text: 'See how ColdStart works', action: '/', icon: '🏒' };
    }
  }

  /** Reset all data (for testing) */
  reset(): void {
    this.profile = {
      sessions: [],
      archetype: null,
      scores: {},
      lastClassified: 0,
      rinkViews: {},
      contributions: 0,
      tripsCreated: 0,
      tripsShared: 0,
      tipExpands: 0,
      signalExpands: 0,
      uniqueRinksViewed: 0,
    };
    this.currentSession = this.startSession();
    this.save();
  }

  /** Flush current session (call on page unload) */
  flush(): void {
    this.closeSession();
  }
}

// ── Singleton ──
// Only create in browser environment
let _instance: VibeEngine | null = null;

export function getVibe(): VibeEngine {
  if (typeof window === 'undefined') {
    // SSR: return a no-op stub
    return {
      log: () => {},
      classify: () => 'unknown',
      archetype: 'unknown',
      is: () => false,
      isSharedLinkGlancer: false,
      rinkViewCount: () => 0,
      isAnxiousAbout: () => false,
      sessionCount: 0,
      contributionCount: 0,
      allScores: {},
      isFirstVisit: true,
      suggestedCTA: { text: 'See how ColdStart works', action: '/', icon: '🏒' },
      reset: () => {},
      flush: () => {},
    } as unknown as VibeEngine;
  }
  if (!_instance) {
    _instance = new VibeEngine();
  }
  return _instance;
}

// Convenience alias
export const vibe = typeof window !== 'undefined' ? getVibe() : null;
