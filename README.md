# VoxHire

VoxHire is an AI-powered voice interview platform built in a Bun monorepo. A candidate submits a GitHub profile URL, the backend scrapes public profile and repository data, and the app runs a live AI-powered interview using OpenAI Realtime audio plus speech transcription. After the session, Google Gemini evaluates the conversation and returns a feedback with score out of 10.

---

## What this project does

- Accepts a GitHub profile URL from the frontend.
- Scrapes the candidate's GitHub profile and repositories on the backend.
- Stores interview metadata and transcripts in PostgreSQL via Prisma.
- Starts a live voice interview using OpenAI's Realtime API.
- Streams the user's microphone to Deepgram for live transcription.
- Sends generated assistant speech transcripts and user transcripts to the database.
- Uses Gemini to score the interview and return feedback.

---

## Architecture

- `apps/frontend` — React SPA served by Bun.
- `apps/backend` — Express API and AI integration server run by Bun.
- `apps/backend/scrapers/github.ts` — GitHub scraping logic.
- `apps/backend/sideband.ts` — OpenAI sideband WebSocket that injects GitHub metadata into the interviewer session.
- `apps/backend/result.ts` — Google Gemini evaluation logic.
- `apps/backend/index2.js` — Optional standalone LinkedIn scraper using Playwright.
- `apps/backend/generated/prisma` — Generated Prisma client.

---

## Project structure

```
VoxHire/
├── apps/
│   ├── backend/
│   │   ├── index.ts           # Express API and OpenAI Realtime call setup
│   │   ├── sideband.ts        # OpenAI Realtime sideband WebSocket
│   │   ├── result.ts          # Gemini scoring and feedback
│   │   ├── db.ts              # Prisma client setup
│   │   ├── types.ts           # Zod request validation
│   │   ├── scrapers/github.ts # GitHub profile and repo scraper
│   │   ├── index2.js          # Optional LinkedIn scraping proxy
│   │   ├── prisma.config.ts   # Prisma configuration
│   │   └── prisma/            # Prisma schema and migrations
│   └── frontend/
│       ├── src/
│       │   ├── components/    # React UI components
│       │   ├── lib/           # frontend constants/config
│       │   └── App.tsx        # Routes
│       ├── package.json
│       └── tsconfig.json
├── packages/                  # shared config and UI packages
└── README.md
```

---

## Required environment variables

Create `apps/backend/.env` with the following variables.

| Variable | Used by | Purpose | Notes |
|---|---|---|---|
| `DATABASE_URL` | `apps/backend/db.ts`, Prisma | PostgreSQL connection string | Example: `postgresql://user:password@localhost:5432/voxhire` |
| `OPENAI_KEY` | `apps/backend/index.ts`, `apps/backend/sideband.ts` | OpenAI API key for the live voice agent | **This key is required and is currently not added yet.** |
| `GITHUB_TOKEN` | `apps/backend/scrapers/github.ts` | GitHub Personal Access Token for profile and repo scraping | Recommended scopes: `read:user`, `public_repo` |
| `GEMINI_API_KEY` | `apps/backend/result.ts` | Google Gemini API key for interview scoring | Required for result evaluation |

### Example `apps/backend/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/voxhire
OPENAI_KEY=sk-...
GITHUB_TOKEN=ghp_...
GEMINI_API_KEY=...
```

> Note: `OPENAI_KEY` must be added before running the voice interview flow. Without it, the backend cannot create the OpenAI Realtime call and the interview page will fail.

---

## Key integrations

### GitHub scraping

Implemented in `apps/backend/scrapers/github.ts`.

- The backend extracts the GitHub username from the submitted URL.
- It calls GitHub REST API endpoints in parallel:
  - `GET https://api.github.com/users/{username}`
  - `GET https://api.github.com/users/{username}/repos?per_page=100`
- It returns structured metadata including profile fields and repo details.
- The returned shape includes:
  - `name`, `bio`, `location`, `company`, `publicRepos`, `followers`
  - repo `name`, `description`, `fullName`, `starCount`, `language`, `topics`
- The GitHub token is sent as `Authorization: Bearer ${GITHUB_TOKEN}`.
- Scraped metadata is stored in the `Interview.githubMetadata` field.

This metadata is later injected into the OpenAI sideband session instructions so the interviewer can ask more relevant questions.

### OpenAI Realtime voice agent

Implemented in `apps/backend/index.ts` and `apps/backend/sideband.ts`.

- The frontend sends a raw SDP offer to `POST /api/v1/session/:interviewId`.
- Backend forwards that offer to `https://api.openai.com/v1/realtime/calls` with `OPENAI_KEY`.
- Backend returns the SDP answer to the frontend.
- After call creation, `sideband.ts` opens `wss://api.openai.com/v1/realtime?call_id=...`.
- It sends a `session.update` event containing instructions and the candidate's GitHub metadata.
- When OpenAI emits `response.done`, the assistant transcript is extracted and saved as a database message.

### Deepgram transcription

Implemented in `apps/frontend/src/components/Interview.tsx`.

- The frontend captures the browser microphone via `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Audio chunks are streamed to Deepgram using a WebSocket:
  - `wss://api.deepgram.com/v1/listen?access_token=...`
- Transcripts from Deepgram are posted back to the backend at:
  - `POST /api/v1/session/user/response/:interviewId`
- The current code includes a hardcoded Deepgram access token in `Interview.tsx`.
- This is not secure for production; the ideal fix is issuing ephemeral backend-signed tokens.

### Google Gemini evaluation

Implemented in `apps/backend/result.ts`.

- After the interview, frontend polls `GET /api/v1/result/:interviewId`.
- If the interview is not yet `Done`, the backend calls Gemini with the full transcript.
- The Gemini prompt asks for JSON output containing `feedback` and `score`.
- The response is validated with a Zod schema.
- The interview record is updated with `status: 
