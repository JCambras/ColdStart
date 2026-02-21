# ColdStart: The Founder User Test
## Claude Code Implementation Prompt

---

**Purpose:** Simulate the most dangerous user ColdStart will ever have — the founder. Jon Cambras built this product. He knows every rink in the seed data personally. He knows what the numbers should be because he's been there. He knows what the app promises because he wrote the copy. He knows what it should feel like because he's the one who imagined it. No one will be harder on ColdStart than the person who dreamed it up and now has to look at what actually shipped. This eval tests whether the product survives its creator's honest scrutiny.

**How to use:** Save this file in your project directory, then in Claude Code: `Read [path]/ColdStart_Founder_User_Test_v1.md and execute the instructions in it.`

---

## The Mindset

You are Jon Cambras. It's 5:15 AM on a Saturday in January. Your son has a game at 7 AM at a rink 45 minutes away. You're sitting in a cold car in the driveway. Your wife is inside with the younger kids. Your phone is at low brightness because the screen is blinding in the dark. You're about to open ColdStart — the product you built — to check the rink your son's playing at today.

But here's the thing: you don't get to be the founder right now. You have to be the user. The tired, cold, slightly annoyed parent who just wants to know three things before getting on the highway: Is parking going to be a nightmare? Is the rink freezing? Is there coffee nearby?

You know how the sausage is made. You know the data is seeded. You know which features are half-built. You know which corners were cut. You're going to feel every one of those cuts today, because you're using the product the way a real parent would — not the way a demo would.

Your job is to be ruthlessly honest. Not cruel. Not nihilistic. Honest. The kind of honest that hurts because it comes from love. You built this thing because you believe hockey parents deserve better information. Now find out if you actually delivered it.

---

## The Walkthrough

### Scenario 1: First Impressions (The Dark Car Test)

Open ColdStart on your phone. Set brightness to low. Hold it at arm's length.

**1.1 The homepage**
- Does the homepage load fast enough that you're not staring at a spinner in the dark?
- Can you read the search bar placeholder text at low brightness?
- Is there enough contrast between the dark hero and the search input?
- Are the touch targets big enough that your cold, gloved fingers can hit them?
- Would a first-time visitor understand what ColdStart is within 3 seconds?

**1.2 The Dark Car Test**
- Open a rink page for a rink you know well (Ice Line, IceWorks, or Oaks Center Ice).
- Can you read the verdict at low brightness?
- Can you distinguish the signal bar colors (green, amber, red)?
- Are the touch targets big enough that you can tap "Share" without accidentally hitting something else?
- Does the warm white background wash out at low brightness, or does it maintain enough contrast?
- This is how ColdStart is actually used at 5:15 AM. Does it pass?

**1.3 The "text Dave" test**
- Before you check ColdStart, imagine you texted Dave instead. Dave's been to this rink twice. He'd reply in 45 seconds with: "Parking's fine, it's freezing, there's a Wawa 2 min away, use the back entrance for Rink C."
- Now open ColdStart and find the same rink. Did you get Dave's answer faster or slower? Was it more or less useful? Did ColdStart tell you anything Dave wouldn't have?
- If ColdStart can't beat texting another hockey parent, nothing else matters. Score this honestly.

---

### Scenario 2: Data Integrity (The Plausibility Test)

**2.1 Signal plausibility**
- Look at every signal for a rink you know well.
- For each one: does the number feel plausible? Would a parent who's never been here get the right impression from this number?
- If a stranger saw "Parking: 3.8" for Ice Line, would they be correctly calibrated for what they'll actually experience on Saturday morning? What about a tournament weekend?
- Where does the seed data accidentally mislead? Which numbers are too generous? Too harsh?
- The data is seeded/synthetic — you know this. The question isn't "is it accurate?" but "is it plausible enough to be useful as a starting point?"

**2.2 The Trust Test**
- A dad in your carpool group opens the link you shared. He sees "Parking: 3.1" with "5 ratings" and a tip from a "Visiting parent."
- Does he believe this data is real? Does "5 ratings" feel like enough to trust?
- Does "Visiting parent" feel anonymous in a suspicious way, or anonymous in a relatable way?
- What would make him trust the data more — and what might make him think "this looks fake"?
- Trust is the critical ingredient for a crowdsourced platform. Rate ColdStart's trust signals honestly.

**2.3 Tip quality**
- Read through the tips on a rink page. Are they the kind of tips a real parent would write?
- Do they sound authentic or generated?
- Would you share a rink page with tips that read like this?

---

### Scenario 3: Competitive Benchmarking

**3.1 The Google Maps/Yelp Test**
- Search for Ice Line on Google Maps. Read the reviews.
- Now compare to ColdStart's rink page. Google has more reviews (quantity). Does ColdStart have better signal (quality)?
- Google shows a 4.2-star rating — one number. ColdStart shows 7 signals. Is the 7-signal model actually more useful for a hockey parent's decision, or is it information overload?
- What does ColdStart show that Google Maps never would? If the answer isn't immediately obvious, ColdStart hasn't differentiated.

**3.2 The Airbnb comparison**
- Open Airbnb and look at any listing. Notice: the verdict is immediate ("Superhost"), the signals are scannable (cleanliness, accuracy, check-in), and the tips are contextual ("perfect for families").
- Now open a ColdStart rink page. Is the verdict as immediate? Are the signals as scannable? Are the tips as contextual?
- Where does ColdStart match the Airbnb standard? Where does it fall short?

**3.3 Data presentation inspiration (Strava lens)**
- Strava makes running a 7:30 mile feel meaningful by showing you that it's "faster than 68% of runners in your area."
- ColdStart shows "Parking: 3.2/5." Does 3.2 feel meaningful? Does it have context? Does it have weight?
- Where ColdStart can learn from Strava: making numbers feel like they mean something by adding comparative context.
- But don't chase Strava's model — ColdStart isn't a personal tracking app. It's a crowdsourced place-intel platform. The comparison is purely about data presentation.

---

### Scenario 4: Feature Completeness

**4.1 The contribution flow**
- Rate a signal on a rink page. Was the flow fast and obvious?
- After you rate, does your contribution feel visible? Can you find evidence that you contributed?
- Would you rate a second signal? A third? Or does the flow make you feel like you're done after one?

**4.2 The Trip Builder**
- Create a trip for this weekend's game. Is the flow intuitive for a parent who's done this before?
- Share the trip link. Does the shared view give the recipient everything they need?
- Would you text this link to your carpool group, or would you screenshot the rink page instead?

**4.3 Dead ends**
- Navigate to every page accessible from the homepage. Find every dead end, disabled button, "coming soon" label, and broken flow.
- For each one: is it a minor annoyance, or does it undermine trust in the product?
- A curious user clicking "Team Manager" on the homepage — what happens? Is the experience acceptable?

---

### Scenario 5: Sharing & Screenshots

**5.1 The Screenshot Test**
- Screenshot the top half of a rink page (what fits on one phone screen).
- Look at it as if you're a parent in the group chat who's never seen ColdStart.
- In 5 seconds: do you understand what you're looking at? Can you extract the one thing you need (parking, cold, food)?
- Does the screenshot have enough context (rink name, location) to be useful without the URL?
- Does it make you want to tap the link, or does the screenshot give you everything you need?

**5.2 The share flow**
- Tap the share button on a rink page. What happens?
- Is the share text useful? Would you edit it before sending, or send it as-is?
- If you're sharing to iMessage vs. a team Slack, does the same share text work for both?

---

### Scenario 6: The Liveness Test

**6.1 Does it feel alive?**
- Open 3-4 rink pages. Does ColdStart feel like a living platform with fresh data, or a static database that was set up once?
- What makes Waze feel alive? (Real-time reports, "reported X minutes ago," active user counts.) What makes ColdStart feel static? What single change would make the biggest difference?

**6.2 Freshness signals**
- When was the last time this rink's data was updated? Can you tell immediately, or do you have to look for it?
- If you see "Updated 2 hours ago" — does that make you trust the data more?
- If there's no freshness signal, does the data feel less trustworthy by default?

---

## Output Format

Respond with exactly these 5 sections. Go deep — quality over quantity. Each section should be substantive, not a list of one-liners.

### 1. The Honest Verdict
One paragraph. No hedging. If you'd show this product at the rink tomorrow, say so. If you'd hide your phone, say that. This is the founder talking to himself in the mirror.

### 2. The Founder Scorecard
Rate each dimension 1-5 with a one-sentence justification:

| Dimension | Score | Why |
|-----------|-------|-----|
| First impression (3-second test) | /5 | |
| Information density (signal-to-noise) | /5 | |
| Data trust (do the numbers feel real?) | /5 | |
| Contribution flow (would you rate twice?) | /5 | |
| Sharing & screenshots (group chat ready?) | /5 | |
| Liveness (does it feel alive?) | /5 | |

**Overall:** X/30

### 3. Pride & Cringe
A single ranked list. Every notable element of the product, scored on a spectrum:

For each item:
- What it is
- Pride or cringe (and how much — slight, moderate, strong)
- If cringe: one-line fix

### 4. The Three Fixes Before Saturday
The three highest-impact changes that could ship before this weekend's games. For each:
- What to change
- Why it matters (in terms of the scenarios above)
- How hard it is (quick fix / half-day / multi-day)

### 5. The Vision Gap
One paragraph. What's the single biggest gap between what ColdStart promises and what it delivers today? Not a feature request — a gap in the core experience. End with: what would the version look like that makes you text a friend "check this out" with genuine pride?
