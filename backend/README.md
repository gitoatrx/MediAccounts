# MediAccounts backend

Node.js and PostgreSQL API for the MediAccounts mobile app.

## First-time setup

1. Copy `.env.example` to `.env` and replace `YOUR_PASSWORD` with the PostgreSQL password created during installation.
2. Set `SEED_ADMIN_NAME` and `SEED_ADMIN_EMAIL` to the first administrator who should be able to log in.
3. Create the `mediaccounts` PostgreSQL database, then run:

```powershell
npm run migrate
npm run seed
npm run dev
```

Sign-in codes are emailed with the `SMTP_*` settings in `.env` (see `.env.example`). Until those are filled in (with the default `EMAIL_MODE=auto`), codes are printed to the Node server console and, outside `NODE_ENV=production`, returned as `devCode` so the app can show them on the verification page.

## Authentication flow

- `POST /auth/request-code` — only active users already stored in PostgreSQL can request a code. Codes last 10 minutes, a new code can be requested every 30 seconds (it replaces the previous one), and a code stops working after 5 wrong attempts.
- `POST /auth/verify-code` — returns a 12-hour bearer session token and allowed businesses.
- `POST /auth/google` — accepts the Google ID token from Google Sign-In (verified against `GOOGLE_WEB_CLIENT_ID`) or a Firebase ID token from Google sign-in; the verified Google email must belong to an active user. Returns the same session response.
- `GET /auth/me`, `POST /auth/logout` — validate or revoke that token.

## Optional Firebase authentication

Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
from a Firebase service-account key. A successful email-code verification then
returns a Firebase custom token. The mobile app exchanges it for an ID token,
and protected API routes accept that Firebase ID token. The existing PostgreSQL
session remains available when these variables are not configured.

## Administrator endpoints

- `GET /users`, `POST /users`, `PATCH /users/:userId`
- `PUT /users/:userId/businesses`
- `GET /businesses`, `GET /businesses/:businessId`, `PATCH /businesses/:businessId`
- `GET /businesses/:businessId/accounts`, `PATCH|DELETE /businesses/:businessId/accounts/:accountId` (delete deactivates the account and keeps its history)

All user-management endpoints require an `Authorization: Bearer <token>` header from an administrator.

## Address search

`GET /places/autocomplete?input=` and `GET /places/:placeId` proxy Google Places API (New) for the Add business form. Set `GOOGLE_MAPS_API_KEY` (a key with Places API (New) enabled) and optionally `GOOGLE_PLACES_REGIONS` (default `ca`).

## Export Bank

- `GET|PUT /businesses/:businessId/accounts/:accountId/export` — admin-only. Saves cheque/bank details for an account (institution no., transit no., account number, MICR, last cheque no., bank address, optional `chequeImage` upload) and the business details in the same form. Full account numbers are encrypted with AES-256-GCM using `BANK_DATA_KEY` (falls back to `OTP_SECRET`).
- `GET /businesses/:businessId/accounts/:accountId/export/file` — downloads a `mediaccounts.bank-export` JSON package (business, bank details including the full account number, cheque image as base64). Every export is logged.
