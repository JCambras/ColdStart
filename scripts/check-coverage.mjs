import fs from 'fs';
const rinks = JSON.parse(fs.readFileSync('data/rinks.json', 'utf8'));
const byState = {};
for (const r of rinks) { byState[r.state] = (byState[r.state] || 0) + 1; }
const sorted = Object.entries(byState).sort((a,b) => b[1] - a[1]);
console.log('Rinks by state:');
for (const [s, c] of sorted) console.log(`  ${s}: ${c}`);
console.log(`\nTotal: ${rinks.length} rinks in ${sorted.length} states`);
const allStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const missing = allStates.filter(s => !(s in byState));
if (missing.length) console.log(`\nMissing states: ${missing.join(', ')}`);
else console.log('\nAll 50 states covered!');
