// GET /api/demo?slug=<slug>
// Returns the demo config for one business plus live Google Places data
// (photos with author attributions, current rating). The Places key stays
// server-side in GOOGLE_PLACES_API_KEY; only place IDs listed in _data.js
// are ever looked up, so the key can't be used for anything else.
const DATA = require('./_data.js');

const PLACES = 'https://places.googleapis.com/v1';

async function livePlace(pid, key) {
  const r = await fetch(`${PLACES}/places/${pid}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'photos,rating,userRatingCount,googleMapsUri',
    },
  });
  if (!r.ok) throw new Error('details ' + r.status);
  const place = await r.json();
  const photos = await Promise.all(
    (place.photos || []).slice(0, 6).map(async (p) => {
      const m = await fetch(`${PLACES}/${p.name}/media?maxWidthPx=1400&skipHttpRedirect=true&key=${key}`);
      if (!m.ok) return null;
      const j = await m.json();
      return {
        url: j.photoUri,
        by: (p.authorAttributions || []).map((a) => ({ name: a.displayName, uri: a.uri })),
      };
    })
  );
  return {
    photos: photos.filter(Boolean),
    rating: place.rating,
    count: place.userRatingCount,
    maps: place.googleMapsUri,
  };
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').toLowerCase();
  const d = DATA[slug];
  res.setHeader('Cache-Control', 'no-store');
  if (!d) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const out = { ...d, live: null };
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (key) {
    try {
      out.live = await livePlace(d.pid, key);
    } catch (e) {
      out.live = null;
    }
  }
  res.status(200).json(out);
};
