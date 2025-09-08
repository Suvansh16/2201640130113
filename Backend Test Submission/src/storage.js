// src/storage.js
// In-memory Map store. For evaluation/testing only.
// Record structure:
// {
//   shortcode: 'abcd1',
//   originalUrl: 'https://example.com',
//   createdAt: Date,
//   expiry: Date,
//   hits: number,
//   clicks: [ { timestamp: Date, referrer, userAgent, country } ]
// }

const store = new Map();

export function putRecord(record) {
  store.set(record.shortcode, record);
}

export function getRecord(shortcode) {
  return store.get(shortcode) || null;
}

export function existsShortcode(shortcode) {
  return store.has(shortcode);
}

export function incrementAndRecordClick(shortcode, click) {
  const rec = store.get(shortcode);
  if (!rec) return null;
  rec.hits += 1;
  rec.lastAccess = new Date();
  rec.clicks.push(click);
  return rec;
}
