export interface Game {
  id: string;
  day: string;
  time: string;
  opponent: string;
  sheet: string;
  note: string;
}

export interface CostItem {
  id: string;
  label: string;
  amount: string;
  splitType: 'per-family' | 'per-player' | 'total';
}

export interface TripRink {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface Trip {
  id: string;
  teamName: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  rink: TripRink;
  hotel?: unknown;
  hotelCost?: string;
  lunch?: unknown;
  lunchCost?: string;
  dinner?: unknown;
  dinnerCost?: string;
  games?: Game[];
  gameTimes?: string;
  costItems?: CostItem[];
  notes?: string;
  collaborative?: boolean;
  familyCount?: number;
  additions?: Addition[];
  createdAt: string;
  rated?: boolean;
}

export interface Addition {
  type: 'restaurant' | 'tip' | 'note';
  text: string;
  addedBy: string;
  createdAt: string;
  cost?: string;
}

export interface NearbyPlace {
  name: string;
  distance: string;
  url: string;
  isFar?: boolean;
}

export interface NearbyData {
  [category: string]: NearbyPlace[];
}
