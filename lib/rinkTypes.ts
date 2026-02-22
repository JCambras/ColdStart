// Shared types for rink-related components

export interface Signal {
  signal: string;
  value: number;
  confidence: number;
  count: number;
  stddev?: number;
}

export interface Tip {
  id?: number;
  text: string;
  contributor_type: string;
  context?: string;
  created_at: string;
  contributor_name?: string;
  contributor_badge?: string;
  user_id?: string;
  operator_response?: { text: string; name: string; role: string };
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
  same_name_rinks?: { id: string; city: string; state: string; address: string }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
  rinksRated: number;
  tipsSubmitted: number;
}
