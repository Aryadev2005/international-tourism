# International tourism booking demos (Codzo)

One template that turns a Google Maps listing into a personalised booking-pipeline demo for a ski school, mountain guide or other tourism business. Each business gets its own link, e.g. `https://codzo-ski-demos.vercel.app/eco-ski-school-andermatt`.

Each demo shows:
- a hero with the business's own Google photos (with photographer credits) and live Google rating
- a working booking flow: lesson or course, meeting point, date, duration, group size, language, instructor, start time, deposit
- the three WhatsApp messages the guest would get automatically (confirmation, evening-before reminder, review request)
- the pipeline view the team would see
- where the business stands against local competitors (Google ratings and review counts), plus three insights from its reviews

## How it works

```
index.html        neutral landing page (does not list prospects)
demo.html         the template; reads the slug from the URL and renders it
vercel.json       rewrites /<slug> to demo.html
api/demo.js       GET /api/demo?slug=<slug> -> config + live Google Places data
api/_data.js      generated: one config per business (not routed by Vercel)
scripts/build_data.py   edit this to add or change businesses, then run it
```

`api/demo.js` calls Places API (New) server-side with `GOOGLE_PLACES_API_KEY`, only for place IDs listed in `api/_data.js`, so the key can't be used for anything else. It fetches the place's photos (up to 6, with author attributions), rating and review count on every request. Nothing from Google is cached or stored, which is what Google's Places terms require. Without the key the page still works and shows an illustrated mountain header instead of photos.

## Turn on real photos

1. In Google Cloud, enable **Places API (New)** and create an API key. Restrict it to that API.
2. In Vercel: project `codzo-ski-demos` → Settings → Environment Variables → add `GOOGLE_PLACES_API_KEY` (Production).
3. Redeploy. Each page load costs one Place Details call plus up to 6 photo calls, which is fine for demo traffic.

## Add a new business

1. Get its `place_id`, rating and review count from Google Places.
2. Add an entry to the `D` list in `scripts/build_data.py`:
   - `slug`: the URL path
   - `name`, `resort`, `pid` (place_id), `r`, `n`
   - `lessons`: use `S()` for a ski school or `G()` for a guide, or your own list. Units are `h`, `day`, `half`, `course` or `addon`.
   - `places`: example meeting points
   - `team`: instructor names from their reviews
   - `comp`: competitors as `[name, rating, reviews]`; include the business itself with `me` set to its name
   - `head`: the headline
   - `cards`: three `[big number, title, text]` insights
   - `academy=True` turns the flow into course applications instead of bookings
3. Run `python3 scripts/build_data.py` and deploy.

## Deploy

```
vercel --prod
```

The project uses no framework and no build step; Vercel serves the static files and the `api/` function.

## Rules for the content

- Every page says it is a concept demo by Codzo, not a live booking site, and that prices, meeting points and availability are examples.
- Only put facts in `cards` and `comp` that come from the business's public listing or reviews.
