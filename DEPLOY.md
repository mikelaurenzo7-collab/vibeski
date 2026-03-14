# Field of Dreams — Deployment Guide
## Off Replit. On your own infrastructure. Forever.

---

## Architecture

```
[Expo Mobile App]
      ↓ API calls
[Express Backend] ← Railway (Node.js hosting)
      ↓
[PostgreSQL DB] ← Neon (serverless Postgres)
```

## Stack
| Layer | Service | Cost |
|-------|---------|------|
| Backend API | [Railway](https://railway.app) | Free → $5/mo |
| Database | [Neon](https://neon.tech) | Free tier |
| Mobile builds | [Expo EAS](https://expo.dev/eas) | Free tier |
| Payments | Stripe | % of revenue |

---

## Step 1 — Database (Neon)

1. Go to [neon.tech](https://neon.tech) → **New Project**
2. Name it `field-of-dreams`
3. Copy the **Connection String** (starts with `postgresql://`)
4. Set as `DATABASE_URL` env var
5. Run migrations: `DATABASE_URL=<your-url> npm run db:push`

---

## Step 2 — Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `mikelaurenzo7-collab/vibeski`
3. Set all environment variables from `.env.production.example`
4. Railway auto-detects `railway.json` and runs the build
5. Your backend is live at `https://your-project.up.railway.app`

**Key env vars required at minimum:**
```
DATABASE_URL       = your Neon connection string  
JWT_SECRET         = 64+ random chars  
OPENAI_API_KEY     = sk-...  
STRIPE_SECRET_KEY  = sk_live_...  
STRIPE_WEBHOOK_SECRET = whsec_...  
NODE_ENV           = production  
```

---

## Step 3 — Stripe Setup

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Products → Create:
   - **Field of Dreams Pro Monthly** → $12/mo → copy Price ID
   - **Field of Dreams Pro Annual** → $108/yr → copy Price ID  
   - **Field of Dreams Elite Monthly** → $29/mo → copy Price ID
   - **Field of Dreams Elite Annual** → $288/yr → copy Price ID
2. Webhooks → Add endpoint: `https://your-railway-url.up.railway.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
3. Copy webhook secret → set `STRIPE_WEBHOOK_SECRET`

---

## Step 4 — Mobile App (Expo EAS)

1. `npm install -g eas-cli`
2. `eas login` (create account at expo.dev if needed)
3. Update `app.json` → set `expo.extra.apiUrl` to your Railway URL
4. `eas build --platform all` → builds iOS + Android
5. `eas submit` → submits to App Store + Play Store

**For web/PWA**: `npm run expo:static:build` → deploys static build

---

## Raptor → OpenAI Migration (already done)

The original code used `@replit/ai-integrations` for the Raptor model.  
This has been replaced with `gpt-4.1-mini` via your existing OpenAI SDK.  
`server/models.ts` now maps `raptor → gpt-4.1-mini`.  
**No behavior change for users** — same model, no Replit dependency.

---

## Custom Domain

1. Railway → Your Project → Settings → Domains → **Add Custom Domain**
2. Add DNS record per Railway's instructions
3. Update `APP_URL` env var to your domain
4. Update Stripe webhook URL to your domain

---

## Monitoring (free)

- Railway: built-in logs and metrics in dashboard
- Neon: query analytics in dashboard  
- Set up [UptimeRobot](https://uptimerobot.com) free tier → ping `/api/health` every 5 min
