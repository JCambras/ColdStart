#!/usr/bin/env node
/**
 * Re-run discovery for states that were missed or underrepresented.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadApiKey() {
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
    const match = env.match(/GOOGLE_PLACES_API_KEY=(.+)/);
    return match?.[1]?.trim();
  } catch { return null; }
}

const API_KEY = loadApiKey();
const PLACES_URL = 'https://places.googleapis.com/v1/places';

let lastReq = 0;
let reqCount = 0;
async function rateLimit() {
  const now = Date.now();
  if (now - lastReq < 200) await new Promise(r => setTimeout(r, 200 - (now - lastReq)));
  lastReq = Date.now();
}

async function textSearch(query, pageToken = null) {
  await rateLimit();
  const body = { textQuery: query, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;
  const res = await fetch(`${PLACES_URL}:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,nextPageToken',
    },
    body: JSON.stringify(body),
  });
  reqCount++;
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

function extractCity(address) {
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) return parts[parts.length - 3];
  if (parts.length >= 2) return parts[0];
  return '';
}

function slugify(name, city) {
  return `${name} ${city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const ICE_RINK_TYPES = new Set(['ice_skating_rink', 'sports_complex', 'stadium', 'athletic_field']);

// States to re-search (missing + underrepresented)
const RETRY_STATES = {
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla'],
  'Arizona': ['Phoenix', 'Scottsdale', 'Tempe', 'Chandler', 'Tucson', 'Peoria', 'Gilbert'],
  'Arkansas': ['Little Rock', 'Bentonville', 'Fort Smith'],
  'Florida': ['Tampa', 'Fort Lauderdale', 'Jacksonville', 'Orlando', 'Coral Springs', 'Estero', 'Sunrise', 'Brandon', 'Wesley Chapel', 'Panama City', 'Ellenton', 'Clearwater'],
  'Hawaii': ['Honolulu', 'Kapolei'],
  'California': ['Los Angeles', 'San Jose', 'San Francisco', 'Anaheim', 'San Diego', 'Sacramento', 'Irvine', 'Ontario', 'Fresno', 'Bakersfield', 'Riverside', 'Escondido', 'Simi Valley', 'Panorama City', 'El Segundo', 'Torrance', 'Yorba Linda', 'Oakland', 'Fremont', 'Santa Rosa', 'Vacaville', 'Roseville', 'Rancho Cucamonga'],
  'Colorado': ['Denver', 'Colorado Springs', 'Boulder', 'Fort Collins', 'Aurora', 'Lakewood', 'Littleton', 'Centennial', 'Monument', 'Arvada', 'Broomfield', 'Loveland', 'Thornton', 'Parker', 'Castle Rock', 'Steamboat Springs', 'Aspen', 'Eagle', 'Durango'],
  'Illinois': ['Chicago', 'Rockford', 'Aurora', 'Naperville', 'Joliet', 'Elgin', 'Peoria', 'Springfield', 'Champaign', 'Bloomington', 'Glenview', 'Bensenville', 'Addison', 'Darien', 'Crystal Lake', 'Geneva', 'Franklin Park', 'Hoffman Estates', 'Lansing', 'Mount Prospect', 'Niles', 'Oak Lawn', 'Orland Park', 'Park Ridge', 'Skokie', 'West Dundee'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'South Bend', 'Evansville', 'Carmel', 'Fishers', 'Westfield', 'Noblesville'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Dubuque', 'Sioux City', 'Waterloo', 'Ames', 'Iowa City'],
  'Georgia': ['Atlanta', 'Marietta', 'Duluth', 'Kennesaw', 'Alpharetta', 'Savannah'],
  'Kentucky': ['Louisville', 'Lexington', 'Covington', 'Owensboro'],
  'Louisiana': ['Baton Rouge', 'New Orleans', 'Metairie'],
  'Idaho': ['Boise', 'Sun Valley', 'Idaho Falls', 'Pocatello', 'Twin Falls'],
  'Maine': ['Portland', 'Bangor', 'Lewiston', 'Biddeford', 'Auburn', 'Orono', 'Waterville', 'Scarborough'],
  'Alabama': ['Birmingham', 'Huntsville', 'Pelham', 'Mobile'],
  'Kansas': ['Kansas City', 'Wichita', 'Olathe', 'Overland Park', 'Topeka'],
  'Delaware': ['Wilmington', 'Newark', 'Dover'],
};

async function run() {
  const rinksFile = path.join(ROOT, 'data', 'rinks.json');
  const existing = JSON.parse(fs.readFileSync(rinksFile, 'utf8'));
  const seenIds = new Set(existing.map(r => r.googlePlaceId));
  let newCount = 0;

  for (const [state, cities] of Object.entries(RETRY_STATES)) {
    console.log(`\nSearching ${state}...`);

    const queries = [
      `ice rink in ${state}`,
      `ice hockey rink in ${state}`,
      `ice skating rink in ${state}`,
      ...cities.map(c => `ice rink near ${c} ${state}`),
    ];

    for (const query of queries) {
      let pageToken = null;
      let pages = 0;
      do {
        try {
          const result = await textSearch(query, pageToken);
          for (const p of (result.places || [])) {
            if (seenIds.has(p.id)) continue;
            const types = p.types || [];
            const name = p.displayName?.text || '';
            const isRink = types.some(t => ICE_RINK_TYPES.has(t)) ||
              /\b(ice|rink|arena|skating|hockey|cold)\b/i.test(name) ||
              /\b(ice.?plex|skate.?zone|ice.?center|ice.?forum|twin.?rinks?)\b/i.test(name);
            if (!isRink) continue;
            if (/\b(roller|inline|skate\s*park|skateboard)\b/i.test(name)) continue;

            seenIds.add(p.id);
            const addr = p.formattedAddress || '';
            const stateMatch = addr.match(/,\s*([A-Z]{2})\s+\d{5}/);
            existing.push({
              googlePlaceId: p.id,
              name,
              address: addr,
              city: extractCity(addr),
              state: stateMatch?.[1] || '',
              latitude: p.location?.latitude || null,
              longitude: p.location?.longitude || null,
              types: p.types || [],
            });
            newCount++;
            console.log(`  + ${name} (${extractCity(addr)}, ${stateMatch?.[1] || '??'})`);
          }
          pageToken = result.nextPageToken || null;
          pages++;
        } catch (err) {
          console.error(`  Error: ${err.message.slice(0, 100)}`);
          pageToken = null;
        }
      } while (pageToken && pages < 5);
    }
  }

  // Re-generate slugs
  const slugCounts = {};
  const rinks = existing.map(p => {
    let slug = slugify(p.name, p.city);
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug += `-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }
    return { ...p, id: slug };
  });

  fs.writeFileSync(rinksFile, JSON.stringify(rinks, null, 2));
  console.log(`\n✓ Added ${newCount} new rinks. Total: ${rinks.length}`);
  console.log(`  API requests: ${reqCount} (~$${(reqCount * 0.035).toFixed(2)})`);
}

run().catch(err => { console.error(err); process.exit(1); });
