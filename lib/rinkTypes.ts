// Shared types for rink-related components

export interface Signal {
  signal: string;
  value: number;
  confidence: number;
  count: number;
}

export interface Tip {
  text: string;
  contributor_type: string;
  context?: string;
  created_at: string;
}

export interface RinkSummary {
  rink_id: string;
  verdict: string;
  signals: Signal[];
  tips: Tip[];
  evidence_counts: Record<string, number>;
  contribution_count: number;
  last_updated_at: string | null;
  confirmed_this_season: boolean;
}

export interface Rink {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface RinkDetail {
  rink: Rink;
  summary: RinkSummary;
  home_teams?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  rinksRated: number;
  tipsSubmitted: number;
}
