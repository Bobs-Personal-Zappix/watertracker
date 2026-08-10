# Local test suite

Runs the actual worker logic (subscribe/upsert, real push delivery, timezone-aware
scheduling, dedup, expired-subscription cleanup, CORS) locally with a mocked KV
store and a real local HTTPS server standing in for a push service — no Cloudflare
account needed.

```bash
cd worker
npm install
openssl req -x509 -newkey rsa:2048 -keyout test/key.pem -out test/cert.pem -days 1 -nodes -subj "/CN=127.0.0.1"
node test/run-tests.mjs
```

Useful to re-run after changing anything in `src/worker.js` (schedule math, dedup
logic, etc.) before redeploying.
