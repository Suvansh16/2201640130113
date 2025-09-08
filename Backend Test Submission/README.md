# URL Shortener Microservice

## Run
1. `npm install`
2. Optionally add `.env` with:
PORT=3000
BASE_URL=http://localhost:3000
3. `npm start`

## Endpoints
- `POST /shorturls`  
Body: `{ "url": "...", "validity": 30, "shortcode": "abc1" }`  
Response (201): `{ "shortLink": "http://host:port/abc1", "expiry": "2025-..." }`

- `GET /:shortcode`  
Redirects (302) to original URL or returns 410/404.

- `GET /shorturls/:shortcode`  
Returns analytics JSON: creation, expiry, totalClicks, clicks[].

## Notes
- Logging is written to `logs/app.log` (structured JSON lines).
- Storage is in-memory (Map) for evaluation. Replace `src/storage.js` with DB connector for persistence.
