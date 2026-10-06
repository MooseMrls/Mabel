# MaBEL - MaPSA Book Evaluation System

MERN stack app (MongoDB, Express, React + Vite, Node 18+).

## Setup

1. `npm run install:all`
2. Copy `server/.env.example` to `server/.env` and fill it in:
   - `MONGO_URI`, `JWT_SECRET`
   - `ADMIN_ID` - the super admin Unique ID (created automatically on server start)
   - `BREVO_API_KEY`, `MAIL_FROM_EMAIL` (must be a verified sender in Brevo), `MAIL_FROM_NAME`
3. `npm run dev` - server on :5000, client on :5173

Without `BREVO_API_KEY` (development only) Unique IDs are printed in the server console instead of emailed.

Production: `npm run build`, then `npm start`. The server serves `client/dist`.

## How it works

- Login: Unique ID only (`MBL-XXXXXX`). Admin signs in on the same page with `ADMIN_ID`.
- Registration: name + email; the ID is emailed through Brevo. Registering again with the same email re-sends the ID.
- Evaluators: publishers -> books -> evaluate. A book accepts 3 evaluations; after that it is greyed out and not clickable. The server enforces the limit, including simultaneous submissions.
- Part 1 only asks for book details that are still empty (from the admin or earlier evaluators). Existing values are never overwritten by evaluators. If nothing is missing, Part 1 is skipped.
- Part 2: scores, pass/fail, overall total and average rating are calculated live in the browser and recomputed on the server. Recommendation is manual.
- Evaluators see their own reports under My Evaluations. Admin: Evaluations (publisher -> evaluator -> reports), Publishers and Books, Evaluators. Reports download as PDF.

## Customising the form

All criteria wording, pass scores and dropdown options are in `server/src/config.js` (one place; the client reads them from the API).
The PDF layout is in `server/src/utils/pdf.js`; the on-screen report is `client/src/components/ReportView.jsx`.
# Mabel
