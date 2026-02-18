// Seed data extracted from rinks/[id]/page.tsx
// In production, all of this comes from the API. These are demo/fallback values.

export interface NearbyPlace {
  name: string;
  distance: string;
  url: string;
  isPartner?: boolean;
  partnerNote?: string;
  isFar?: boolean;
}

// Rink manager notes per signal
export const FACILITY_DETAILS: Record<string, Record<string, { text: string; name: string }>> = {
};

// Demo signal values for hardcoded rinks — ensures all 6 signals show
export const SEEDED_SIGNALS: Record<string, Record<string, { value: number; count: number; confidence: number }>> = {
  'bww': {
    family_friendly: { value: 4.8, count: 32, confidence: 0.85 },
    locker_rooms: { value: 3.2, count: 18, confidence: 0.6 },
    pro_shop: { value: 3.9, count: 14, confidence: 0.5 },
  },
  'ice-line': {
    family_friendly: { value: 4.5, count: 28, confidence: 0.8 },
    locker_rooms: { value: 4.6, count: 22, confidence: 0.75 },
    pro_shop: { value: 4.7, count: 20, confidence: 0.7 },
  },
  'proskate': {
    family_friendly: { value: 3.8, count: 15, confidence: 0.55 },
    locker_rooms: { value: 2.4, count: 10, confidence: 0.4 },
    pro_shop: { value: 1.8, count: 8, confidence: 0.35 },
  },
};

// Streaming info per rink
export const RINK_STREAMING: Record<string, { type: 'livebarn' | 'blackbear' | 'none'; url?: string }> = {
  'ice-line': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/ice-line-quad-rinks' },
  'bww': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/brewster-wheeler-works' },
  'iceworks': { type: 'blackbear', url: 'https://www.blackbeartv.com/arena/iceworks-skating-complex' },
  'virtua': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/virtua-center-flyers-skate-zone' },
  'proskate': { type: 'none' },
  'hatfield': { type: 'none' },
};

// Home teams per rink
export const RINK_HOME_TEAMS: Record<string, string[]> = {
  'ice-line': ['Ice Line Revolution', 'West Chester Storm'],
  'bww': ['BWW Icehawks', 'Detroit Jr. Vipers'],
  'iceworks': ['Aston Rebels', 'Delaware Valley Eagles'],
  'virtua': ['Flyers Skate Zone Warriors', 'South Jersey Bandits'],
  'proskate': ['Central Jersey Cobras'],
  'hatfield': ['Hatfield Ice Dogs'],
};

// Manager replies to tips
export const MANAGER_RESPONSES: Record<string, Record<number, { text: string; name: string; role: string }>> = {
};

// Nearby places per rink (up to 10 per category within 3mi)
export const SEEDED_NEARBY: Record<string, Record<string, NearbyPlace[]>> = {
  'bww': {
    quick_bite: [
      { name: "Tim Hortons", distance: "0.3 mi", url: "https://www.google.com/maps/search/Tim+Hortons+near+Troy+MI" },
      { name: "Panera Bread", distance: "0.5 mi", url: "https://www.google.com/maps/search/Panera+Bread+near+Troy+MI" },
      { name: "Bagel Fragel", distance: "0.8 mi", url: "https://www.google.com/maps/search/Bagel+Fragel+Troy+MI" },
      { name: "Jimmy John's", distance: "0.6 mi", url: "https://www.google.com/maps/search/Jimmy+Johns+Troy+MI" },
      { name: "Subway", distance: "0.4 mi", url: "https://www.google.com/maps/search/Subway+Troy+MI" },
      { name: "Potbelly Sandwich", distance: "1.1 mi", url: "https://www.google.com/maps/search/Potbelly+Troy+MI" },
      { name: "Tropical Smoothie", distance: "0.9 mi", url: "https://www.google.com/maps/search/Tropical+Smoothie+Troy+MI" },
      { name: "Coney Island", distance: "0.7 mi", url: "https://www.google.com/maps/search/coney+island+restaurant+Troy+MI" },
    ],
    coffee: [
      { name: "Starbucks", distance: "0.4 mi", url: "https://www.google.com/maps/search/Starbucks+near+Troy+MI" },
      { name: "Biggby Coffee", distance: "0.6 mi", url: "https://www.google.com/maps/search/Biggby+Coffee+Troy+MI" },
      { name: "Dunkin'", distance: "0.8 mi", url: "https://www.google.com/maps/search/Dunkin+Troy+MI" },
      { name: "Tim Hortons", distance: "0.3 mi", url: "https://www.google.com/maps/search/Tim+Hortons+Troy+MI" },
      { name: "Caribou Coffee", distance: "1.4 mi", url: "https://www.google.com/maps/search/Caribou+Coffee+Troy+MI" },
    ],
    team_lunch: [
      { name: "Buffalo Wild Wings", distance: "0.1 mi", url: "https://www.google.com/maps/search/Buffalo+Wild+Wings+Troy+MI" },
      { name: "Applebee's", distance: "0.7 mi", url: "https://www.google.com/maps/search/Applebees+Troy+MI" },
      { name: "Chili's", distance: "1.2 mi", url: "https://www.google.com/maps/search/Chilis+Troy+MI" },
      { name: "Red Robin", distance: "1.5 mi", url: "https://www.google.com/maps/search/Red+Robin+Troy+MI" },
      { name: "Olive Garden", distance: "1.8 mi", url: "https://www.google.com/maps/search/Olive+Garden+Troy+MI" },
      { name: "Bob Evans", distance: "1.3 mi", url: "https://www.google.com/maps/search/Bob+Evans+Troy+MI" },
      { name: "Cracker Barrel", distance: "2.4 mi", url: "https://www.google.com/maps/search/Cracker+Barrel+Troy+MI" },
      { name: "TGI Friday's", distance: "2.1 mi", url: "https://www.google.com/maps/search/TGI+Fridays+Troy+MI" },
    ],
    dinner: [
      { name: "Andiamo", distance: "1.1 mi", url: "https://www.google.com/maps/search/Andiamo+Troy+MI" },
      { name: "Red Olive", distance: "0.9 mi", url: "https://www.google.com/maps/search/Red+Olive+Troy+MI" },
      { name: "Kona Grill", distance: "1.4 mi", url: "https://www.google.com/maps/search/Kona+Grill+Troy+MI" },
      { name: "P.F. Chang's", distance: "1.6 mi", url: "https://www.google.com/maps/search/PF+Changs+Troy+MI" },
      { name: "Granite City", distance: "1.8 mi", url: "https://www.google.com/maps/search/Granite+City+Troy+MI" },
      { name: "Bonefish Grill", distance: "2.0 mi", url: "https://www.google.com/maps/search/Bonefish+Grill+Troy+MI" },
      { name: "Maggiano's", distance: "2.3 mi", url: "https://www.google.com/maps/search/Maggianos+Troy+MI" },
      { name: "Capital Grille", distance: "2.8 mi", url: "https://www.google.com/maps/search/Capital+Grille+Troy+MI" },
    ],
    bowling: [
      { name: "Troy Lanes", distance: "1.8 mi", url: "https://www.google.com/maps/search/bowling+Troy+MI" },
      { name: "Thunderbowl Lanes", distance: "2.9 mi", url: "https://www.google.com/maps/search/Thunderbowl+Lanes+Troy+MI" },
    ],
    arcade: [
      { name: "Dave & Buster's", distance: "2.1 mi", url: "https://www.google.com/maps/search/Dave+Busters+Troy+MI" },
    ],
    movies: [
      { name: "MJR Troy Grand Cinema", distance: "1.5 mi", url: "https://www.google.com/maps/search/movie+theater+Troy+MI" },
      { name: "AMC Forum 30", distance: "2.6 mi", url: "https://www.google.com/maps/search/AMC+Forum+Sterling+Heights+MI" },
    ],
    fun: [
      { name: "Sky Zone", distance: "3.2 mi", url: "https://www.google.com/maps/search/Sky+Zone+near+Troy+MI" },
      { name: "Zap Zone", distance: "2.8 mi", url: "https://www.google.com/maps/search/Zap+Zone+near+Troy+MI" },
    ],
    hotels: [
      { name: "Drury Inn & Suites", distance: "0.5 mi", url: "https://www.google.com/maps/search/Drury+Inn+Troy+MI" },
      { name: "Hilton Garden Inn", distance: "0.8 mi", url: "https://www.google.com/maps/search/Hilton+Garden+Inn+Troy+MI" },
      { name: "Embassy Suites", distance: "1.2 mi", url: "https://www.google.com/maps/search/Embassy+Suites+Troy+MI" },
      { name: "Marriott Troy", distance: "0.9 mi", url: "https://www.google.com/maps/search/Marriott+Troy+MI" },
      { name: "Hampton Inn Troy", distance: "1.0 mi", url: "https://www.google.com/maps/search/Hampton+Inn+Troy+MI" },
    ],
    gas: [
      { name: "Shell", distance: "0.3 mi", url: "https://www.google.com/maps/search/Shell+gas+Troy+MI" },
      { name: "Speedway", distance: "0.5 mi", url: "https://www.google.com/maps/search/Speedway+gas+Troy+MI" },
      { name: "Costco Gas", distance: "1.8 mi", url: "https://www.google.com/maps/search/Costco+gas+Troy+MI" },
    ],
  },
  'ice-line': {
    quick_bite: [
      { name: "Wawa", distance: "0.2 mi", url: "https://www.google.com/maps/search/Wawa+near+West+Chester+PA" },
      { name: "Kildare's", distance: "0.5 mi", url: "https://www.google.com/maps/search/Kildares+West+Chester+PA" },
      { name: "Jersey Mike's", distance: "0.8 mi", url: "https://www.google.com/maps/search/Jersey+Mikes+West+Chester+PA" },
      { name: "Chick-fil-A", distance: "1.1 mi", url: "https://www.google.com/maps/search/Chick+fil+A+West+Chester+PA" },
      { name: "Five Guys", distance: "0.9 mi", url: "https://www.google.com/maps/search/Five+Guys+West+Chester+PA" },
      { name: "Chipotle", distance: "1.0 mi", url: "https://www.google.com/maps/search/Chipotle+West+Chester+PA" },
    ],
    coffee: [
      { name: "La Colombe", distance: "0.7 mi", url: "https://www.google.com/maps/search/La+Colombe+West+Chester+PA" },
      { name: "Starbucks", distance: "0.4 mi", url: "https://www.google.com/maps/search/Starbucks+West+Chester+PA" },
      { name: "Dunkin'", distance: "0.6 mi", url: "https://www.google.com/maps/search/Dunkin+West+Chester+PA" },
      { name: "Boxcar Brewing", distance: "1.2 mi", url: "https://www.google.com/maps/search/Boxcar+Brewing+West+Chester+PA" },
    ],
    team_lunch: [
      { name: "Sal's Pizza", distance: "0.1 mi", url: "https://www.google.com/maps/search/pizza+West+Chester+PA", isPartner: true, partnerNote: "10% off on game days — show your team jersey" },
      { name: "TGI Friday's", distance: "1.0 mi", url: "https://www.google.com/maps/search/TGI+Fridays+West+Chester+PA" },
      { name: "Applebee's", distance: "1.3 mi", url: "https://www.google.com/maps/search/Applebees+near+West+Chester+PA" },
      { name: "Red Robin", distance: "1.5 mi", url: "https://www.google.com/maps/search/Red+Robin+West+Chester+PA" },
      { name: "Olive Garden", distance: "1.8 mi", url: "https://www.google.com/maps/search/Olive+Garden+Exton+PA" },
      { name: "Buffalo Wild Wings", distance: "2.0 mi", url: "https://www.google.com/maps/search/Buffalo+Wild+Wings+West+Chester+PA" },
      { name: "Chili's", distance: "2.2 mi", url: "https://www.google.com/maps/search/Chilis+Exton+PA" },
    ],
    dinner: [
      { name: "Iron Hill Brewery", distance: "0.6 mi", url: "https://www.google.com/maps/search/Iron+Hill+Brewery+West+Chester+PA" },
      { name: "Pietro's Prime", distance: "0.9 mi", url: "https://www.google.com/maps/search/Pietros+Prime+West+Chester+PA" },
      { name: "Limoncello", distance: "0.7 mi", url: "https://www.google.com/maps/search/Limoncello+West+Chester+PA" },
      { name: "Roots Café", distance: "0.8 mi", url: "https://www.google.com/maps/search/Roots+Cafe+West+Chester+PA" },
      { name: "Más Mexicali Cantina", distance: "0.5 mi", url: "https://www.google.com/maps/search/Mas+Mexicali+West+Chester+PA" },
      { name: "Torpedoes", distance: "1.1 mi", url: "https://www.google.com/maps/search/Torpedoes+West+Chester+PA" },
    ],
    bowling: [
      { name: "Palace Bowling", distance: "2.5 mi", url: "https://www.google.com/maps/search/bowling+near+West+Chester+PA" },
    ],
    arcade: [
      { name: "Round1", distance: "3.8 mi", url: "https://www.google.com/maps/search/Round1+near+West+Chester+PA" },
      { name: "Dave & Buster's", distance: "6.5 mi", url: "https://www.google.com/maps/search/Dave+Busters+near+West+Chester+PA", isFar: true },
    ],
    movies: [
      { name: "Regal Downingtown", distance: "2.2 mi", url: "https://www.google.com/maps/search/movie+theater+near+West+Chester+PA" },
      { name: "AMC Painters Crossing", distance: "2.8 mi", url: "https://www.google.com/maps/search/AMC+West+Chester+PA" },
    ],
    fun: [
      { name: "Urban Air", distance: "4.0 mi", url: "https://www.google.com/maps/search/Urban+Air+near+West+Chester+PA" },
      { name: "Laser Quest", distance: "5.2 mi", url: "https://www.google.com/maps/search/Laser+Quest+near+West+Chester+PA", isFar: true },
    ],
    hotels: [
      { name: "Hampton Inn Route 30", distance: "0.8 mi", url: "https://www.google.com/maps/search/Hampton+Inn+West+Chester+PA", isPartner: true, partnerNote: "Tournament group rate available — mention Ice Line" },
      { name: "Courtyard by Marriott", distance: "1.1 mi", url: "https://www.google.com/maps/search/Courtyard+Marriott+West+Chester+PA" },
      { name: "Holiday Inn Express", distance: "1.5 mi", url: "https://www.google.com/maps/search/Holiday+Inn+Express+Exton+PA" },
      { name: "Residence Inn", distance: "1.9 mi", url: "https://www.google.com/maps/search/Residence+Inn+Exton+PA" },
    ],
    gas: [
      { name: "Wawa (gas)", distance: "0.2 mi", url: "https://www.google.com/maps/search/Wawa+gas+West+Chester+PA" },
      { name: "Sunoco", distance: "0.6 mi", url: "https://www.google.com/maps/search/Sunoco+gas+West+Chester+PA" },
      { name: "Turkey Hill", distance: "1.1 mi", url: "https://www.google.com/maps/search/Turkey+Hill+gas+West+Chester+PA" },
    ],
  },
  'proskate': {
    quick_bite: [
      { name: "White Manna", distance: "0.4 mi", url: "https://www.google.com/maps/search/White+Manna+Hackensack+NJ" },
      { name: "Dunkin'", distance: "0.2 mi", url: "https://www.google.com/maps/search/Dunkin+Hackensack+NJ" },
      { name: "Chipotle", distance: "0.6 mi", url: "https://www.google.com/maps/search/Chipotle+Hackensack+NJ" },
      { name: "Wawa", distance: "0.5 mi", url: "https://www.google.com/maps/search/Wawa+Hackensack+NJ" },
      { name: "Five Guys", distance: "0.8 mi", url: "https://www.google.com/maps/search/Five+Guys+Hackensack+NJ" },
      { name: "Shake Shack", distance: "1.2 mi", url: "https://www.google.com/maps/search/Shake+Shack+Hackensack+NJ" },
      { name: "Smashburger", distance: "0.9 mi", url: "https://www.google.com/maps/search/Smashburger+Hackensack+NJ" },
    ],
    coffee: [
      { name: "Starbucks", distance: "0.3 mi", url: "https://www.google.com/maps/search/Starbucks+Hackensack+NJ" },
      { name: "Dunkin'", distance: "0.2 mi", url: "https://www.google.com/maps/search/Dunkin+Hackensack+NJ" },
      { name: "Bluestone Lane", distance: "1.4 mi", url: "https://www.google.com/maps/search/Bluestone+Lane+Hackensack+NJ" },
    ],
    team_lunch: [
      { name: "Olive Garden", distance: "0.9 mi", url: "https://www.google.com/maps/search/Olive+Garden+Hackensack+NJ" },
      { name: "Chili's", distance: "1.1 mi", url: "https://www.google.com/maps/search/Chilis+Hackensack+NJ" },
      { name: "Red Lobster", distance: "1.3 mi", url: "https://www.google.com/maps/search/Red+Lobster+Hackensack+NJ" },
      { name: "Applebee's", distance: "1.5 mi", url: "https://www.google.com/maps/search/Applebees+Hackensack+NJ" },
      { name: "TGI Friday's", distance: "1.8 mi", url: "https://www.google.com/maps/search/TGI+Fridays+Hackensack+NJ" },
      { name: "Red Robin", distance: "2.0 mi", url: "https://www.google.com/maps/search/Red+Robin+Hackensack+NJ" },
      { name: "Cheesecake Factory", distance: "2.5 mi", url: "https://www.google.com/maps/search/Cheesecake+Factory+Hackensack+NJ" },
    ],
    dinner: [
      { name: "Capital Grille", distance: "1.5 mi", url: "https://www.google.com/maps/search/Capital+Grille+Hackensack+NJ" },
      { name: "Bonefish Grill", distance: "1.2 mi", url: "https://www.google.com/maps/search/Bonefish+Grill+Hackensack+NJ" },
      { name: "Morton's Steakhouse", distance: "1.8 mi", url: "https://www.google.com/maps/search/Mortons+Steakhouse+Hackensack+NJ" },
      { name: "Nobi Sushi", distance: "0.7 mi", url: "https://www.google.com/maps/search/Nobi+Sushi+Hackensack+NJ" },
      { name: "Stony Hill Inn", distance: "1.0 mi", url: "https://www.google.com/maps/search/Stony+Hill+Inn+Hackensack+NJ" },
    ],
    bowling: [
      { name: "Bowler City", distance: "1.8 mi", url: "https://www.google.com/maps/search/bowling+Hackensack+NJ" },
      { name: "Lodi Lanes", distance: "2.5 mi", url: "https://www.google.com/maps/search/bowling+Lodi+NJ" },
    ],
    arcade: [
      { name: "Dave & Buster's", distance: "3.0 mi", url: "https://www.google.com/maps/search/Dave+Busters+near+Hackensack+NJ" },
      { name: "iPlay America", distance: "8.5 mi", url: "https://www.google.com/maps/search/iPlay+America+NJ", isFar: true },
    ],
    movies: [
      { name: "AMC Garden State", distance: "2.0 mi", url: "https://www.google.com/maps/search/AMC+Garden+State+NJ" },
      { name: "Regal Cinema Paramus", distance: "2.8 mi", url: "https://www.google.com/maps/search/Regal+Cinema+Paramus+NJ" },
    ],
    fun: [
      { name: "Sky Zone", distance: "3.5 mi", url: "https://www.google.com/maps/search/Sky+Zone+near+Hackensack+NJ" },
      { name: "Topgolf Edison", distance: "9.0 mi", url: "https://www.google.com/maps/search/Topgolf+Edison+NJ", isFar: true },
    ],
    hotels: [
      { name: "Hilton Hasbrouck Heights", distance: "1.5 mi", url: "https://www.google.com/maps/search/Hilton+Hasbrouck+Heights+NJ" },
      { name: "DoubleTree Mahwah", distance: "3.2 mi", url: "https://www.google.com/maps/search/DoubleTree+Mahwah+NJ" },
      { name: "Homewood Suites", distance: "2.0 mi", url: "https://www.google.com/maps/search/Homewood+Suites+Hackensack+NJ" },
      { name: "Courtyard by Marriott", distance: "1.8 mi", url: "https://www.google.com/maps/search/Courtyard+Marriott+Paramus+NJ" },
    ],
  },
};

// Fan favorites seed data for demo rinks
export const SEEDED_FAN_FAVORITES: Record<string, { name: string; review: string; category: string; author: string; date: string }[]> = {
  'bww': [
    { name: "Shield's Pizza", review: "Detroit-style deep dish, perfect after a long tournament day. Kids love it.", category: "Team Restaurants", author: "Mike B.", date: "2026-01-18T14:30:00Z" },
    { name: "Biggby Coffee", review: "Way better than Starbucks and never a line on Saturday mornings.", category: "Coffee", author: "Sarah K.", date: "2026-01-25T08:15:00Z" },
  ],
  'ice-line': [
    { name: "Barnaby's", review: "Huge portions, seats 30 easy. Our go-to for post-tournament team dinner.", category: "Team Restaurants", author: "Kevin M.", date: "2026-01-20T18:00:00Z" },
    { name: "La Colombe Coffee", review: "Best lattes in West Chester. Warm up between games.", category: "Coffee", author: "Jen T.", date: "2026-02-01T09:30:00Z" },
    { name: "Kildare's Irish Pub", review: "Great loaded nachos and plenty of TVs for the parents.", category: "Dinner", author: "Dan R.", date: "2026-02-08T19:45:00Z" },
  ],
  'proskate': [
    { name: "White Manna", review: "Tiny burger joint, cash only. Legendary sliders — a must-try.", category: "Quick bite", author: "Tom L.", date: "2026-01-12T12:00:00Z" },
    { name: "Nobi Sushi", review: "Surprisingly great sushi near the rink. Kids menu available.", category: "Dinner", author: "Lisa P.", date: "2026-02-05T18:30:00Z" },
  ],
};
