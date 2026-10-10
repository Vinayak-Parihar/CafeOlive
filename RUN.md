# RUN.md — Cafe Olive

Instructions to set up and run the Cafe Olive project locally. Generated from the current codebase (`backend/` and `frontend/`).

---

## 1. Project Type Detection

This is a **MERN-style split-repo web app** — no PHP/CodeIgniter or WordPress code was found.

| Layer | Stack detected | Evidence |
|---|---|---|
| **Backend** | Node.js (ESM) + Express 5 + MongoDB/Mongoose | [`backend/package.json`](backend/package.json) → `"type": "module"`, `"express": "^5.2.1"`, `"mongoose": "^9.0.1"` |
| **Frontend** | React 19 + Vite 7 + Tailwind CSS 3 | [`frontend/package.json`](frontend/package.json) → `"react": "^19.2.0"`, `"vite": "^7.2.4"`, `"tailwindcss": "^3.4.19"` |
| **Database** | MongoDB Atlas (cloud cluster) | `backend/.env` → `MONGODB_URL=mongodb+srv://...@cluster0.qknp4bp.mongodb.net` |
| **File storage** | Cloudinary | `cloudinary` dependency + `CLOUDINARY_*` env vars |
| **Payments** | Razorpay | `razorpay` dependency + `RAZORPAY_*` env vars |
| **Email / WhatsApp** | Nodemailer (SMTP) + Twilio | `SMTP_*`, `TWILIO_*` env vars |
| **Auth** | JWT (access + refresh tokens) via `jsonwebtoken` + `bcrypt` | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` env vars |

There is no root-level `package.json` — the backend and frontend are two independent Node projects, each with its own `package.json`, run from their own directory.

---

## 2. Run Commands

### A. Database

The project points at a **MongoDB Atlas** cloud cluster (`MONGODB_URL` in `backend/.env` uses the `mongodb+srv://` scheme), so **no local `mongod` needs to be started** as long as that connection string is reachable and valid.

If you want to run against a local MongoDB instance instead, install MongoDB Community Server and start it, then set:
```ini
MONGODB_URL=mongodb://127.0.0.1:27017
```
in `backend/.env` (the code appends the DB name `cafeolive` automatically — see [`backend/src/constants.js`](backend/src/constants.js) and [`backend/src/db/connection.js`](backend/src/db/connection.js)).

### B. Backend (Express API)

```bash
cd backend
npm install
npm run dev
```
- `npm run dev` runs: `nodemon -r dotenv/config --experimental-json-modules src/index.js`
- Starts the API at `http://localhost:PORT` (from `backend/.env`, currently `PORT=3000`).
- There is **no dedicated `start`/production script** in `backend/package.json`. To run without file-watching/auto-restart, run the entry file directly:
```bash
cd backend
node src/index.js
```
(`src/index.js` already calls `dotenv.config()` itself, so `-r dotenv/config` is not required for a plain `node` run.)

### C. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```
- Starts the Vite dev server (default `http://localhost:5173`, Vite will pick `5174` etc. if that port is busy).
- [`frontend/vite.config.js`](frontend/vite.config.js) proxies all `/api/*` requests to `http://localhost:3000` — **this must match the backend's `PORT`**. All frontend `axios` calls use relative paths like `/api/...` (no `VITE_*` base-URL env vars are used anywhere in `frontend/src`), so they only work through this proxy in dev.

**Production build:**
```bash
cd frontend
npm run build      # outputs static assets to frontend/dist
npm run preview    # serves the built dist/ locally for a sanity check
```
There is no wiring yet that makes the backend serve `frontend/dist` automatically (`backend/src/app.js` serves a static `public/` folder, which currently only contains a `qrcode.png`, not the built frontend). To deploy for real, either:
- copy `frontend/dist/*` into `backend/public/` so Express serves it, or
- host the frontend separately and set `CORS_ORIGIN` in `backend/.env` to that frontend's URL.

### D. Running both together (typical local dev)

Open two terminals:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```
Then open the frontend dev URL printed by Vite (e.g. `http://localhost:5173`).

### E. Queue / Cron / Worker processes

No queue, cron, or background-worker files or dependencies (no Bull/BullMQ, Agenda, node-cron, etc.) were found in the codebase. The backend is a single Express process — nothing else needs to run alongside it.

One-off maintenance/debug scripts exist under `backend/src/` and can be run manually with `node` if ever needed (not part of normal startup):
- `node src/seedAdmin.js` — creates a default admin user (⚠️ see Common Errors below — has a hardcoded connection string, don't run against production data without editing it first).
- `node src/testAdmin.js`, `node src/debugMenu.js`, `node src/debugCategory.js`, `node src/verify_rbac.js` — ad-hoc debug/verification scripts.

---

## 3. Environment Check

Run these before starting either app:

```bash
node -v          # verify Node.js is installed (project uses ESM / "type": "module")
npm -v           # verify npm is installed
```

**Backend:**
```bash
cd backend
npm install                 # install dependencies (installs bcrypt, which needs native build tools)
node -e "require('fs').existsSync('.env') && console.log('.env found') || console.log('MISSING .env')"
```
Required variables in `backend/.env` (all consumed by the backend code — see `backend/src/db/connection.js`, `backend/src/app.js`, and the controllers):
```
PORT
MONGODB_URL
CORS_ORIGIN
ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRY
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
```
There is no `.env.example` checked in — a documented template already exists in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) if you need to recreate `backend/.env` from scratch on a new machine.

**Frontend:**
```bash
cd frontend
npm install
npm run lint     # optional — checks the code compiles/lints cleanly (eslint.config.js is present)
```
No `.env` file is required for the frontend — it has no `VITE_*` variables.

---

## 4. Common Run Errors & Fixes

| Error you'll see | Cause | Fix |
|---|---|---|
| `Server startup failed  Error: MONGODB_URL is not defined in environment variables` | `backend/.env` is missing or `MONGODB_URL` isn't set (see the explicit check in `backend/src/db/connection.js`) | Create/fix `backend/.env` with a valid `MONGODB_URL` (template in `docs/DEVELOPMENT.md`) |
| `Mongo connection failed: MongoServerError: bad auth` | Wrong username/password in the Atlas connection string, or your IP isn't allow-listed in Atlas Network Access | Double-check credentials; add your current IP (or `0.0.0.0/0` for local dev only) in the Atlas cluster's IP Access List |
| `Error: listen EADDRINUSE: address already in use :::3000` | Another process (often a previous `nodemon` instance) is already bound to the backend `PORT` | Stop the other process, or change `PORT` in `backend/.env` — remember to also update the `target` in `frontend/vite.config.js` if you do |
| Frontend `axios` calls return `404`/`ECONNREFUSED` / network error in the browser console | Backend isn't running, or its port doesn't match the `target: 'http://localhost:3000'` in `frontend/vite.config.js` | Start the backend first, and make sure `backend/.env`'s `PORT` matches the Vite proxy target |
| CORS error in the browser (`No 'Access-Control-Allow-Origin' header`) | `CORS_ORIGIN` in `backend/.env` doesn't match the frontend's actual dev URL (defaults to `http://localhost:5173` in `backend/src/app.js` if unset, but Vite may have started on `5174`+ if `5173` was busy) | Set `CORS_ORIGIN` in `backend/.env` to the exact origin Vite printed on startup |
| `npm install` fails while building `bcrypt` (native module, node-gyp errors) on Windows | Missing native build tools for the platform | Install the "Desktop development with C++" workload (Visual Studio Build Tools) and Python, then re-run `npm install`; alternatively ensure you're on a prebuilt-binary-compatible Node version |
| `SyntaxError: Cannot use import statement outside a module` | Running a backend file directly with a plain `node file.js` from the wrong context, or Node version too old for top-level ESM | Confirm `backend/package.json` has `"type": "module"` (it does) and run from inside `backend/`; use a current Node.js LTS version |
| Login/admin routes return 401/empty data with no obvious cause | No admin user exists yet in a fresh database | Run `node backend/src/seedAdmin.js` once to seed a default admin (edit the hardcoded `MONGODB_URI` at the top of that file first, or point it at your own connection string — don't reuse a shared/example URI in production) |
| Emails/WhatsApp messages silently fail (reservation confirmations, etc.) | `SMTP_*` or `TWILIO_*` env vars are placeholder/missing values | These are optional for local UI testing but must be filled with real credentials for those notification features to work |
| Payment step throws a Razorpay auth error, or silently uses a test key | `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` missing — the code falls back to a hardcoded test key (`rzp_test_5pB8m5NfR0Z1G6`, see `docs/CURRENT_ISSUES.md`) | Set real `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in `backend/.env`; test keys only work with Razorpay's test-mode checkout |

---

## Reference

More detail on setup, architecture, and known issues already exists in [`docs/`](docs/):
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — local setup walkthrough + `.env` template
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/DATABASE.md`](docs/DATABASE.md) — data models
- [`docs/CURRENT_ISSUES.md`](docs/CURRENT_ISSUES.md) — known bugs and security gaps
- [`docs/SECURITY.md`](docs/SECURITY.md) — auth/security notes
