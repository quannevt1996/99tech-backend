# Problem 5

CRUD API for crypto price alerts ("tell me when SWTH goes above 0.0052"). Express 5, TypeScript, SQLite.

Needs Node 22.12+.

```
npm install
npm run dev
```

Runs on http://localhost:3000, data goes to `./data/alerts.db`. Change them with `PORT` and `DATABASE_PATH` (copy `.env.example` to `.env`).

For a production build: `npm run build && npm start`.

## Endpoints

- `POST /alerts`: create, 201
- `GET /alerts`: list with filters
- `GET /alerts/:id`
- `PATCH /alerts/:id`: partial update
- `DELETE /alerts/:id`: 204

```json
{ "symbol": "SWTH", "condition": "above", "targetPrice": 0.0052, "note": "optional", "active": true }
```

List filters: `symbol`, `condition`, `active`, `minPrice`, `maxPrice`, plus `limit` and `offset`. The response is `{ "data": [...], "page": { "limit": 20, "offset": 0, "total": 2 } }`.

```
curl -X POST localhost:3000/alerts -H 'Content-Type: application/json' -d '{"symbol":"swth","condition":"above","targetPrice":0.0052}'
curl 'localhost:3000/alerts?symbol=swth&active=true'
curl localhost:3000/alerts/1
curl -X PATCH localhost:3000/alerts/1 -H 'Content-Type: application/json' -d '{"active":false}'
curl -X DELETE localhost:3000/alerts/1
```

Errors look like `{ "error": { "code": "...", "message": "..." } }`, plus `details` for validation errors.

## Notes

- SQLite, so there's nothing to install. better-sqlite3 is sync, which is fine for a local file.
- The table is created on startup if it doesn't exist.
- Unknown fields and query params return 400, so a typo like `?symbl=ETH` doesn't quietly return everything.
- Prices are REAL (float). Fine for alerts, not for money math.
