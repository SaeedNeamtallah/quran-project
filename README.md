# Quranic Pomodoro

Quranic Pomodoro is an Arabic-first focus + Quran reading app.

The project currently runs as a dual-service stack:

- FastAPI backend for Quran, recitation, tafsir, and timing APIs
- Next.js frontend for the user interface and reader experience

## Current Architecture

- Backend API: `main.py` on `http://127.0.0.1:8080`
- Frontend app: `new q/` on `http://127.0.0.1:3000`
- Windows launcher: `start.bat` installs/checks dependencies and starts both services in the background

## Reader UX Highlights

- Rub reading mode and Mushaf page mode
- Verse audio preview plus full page/rub recitation playback
- Word-by-word highlight during recitation using timing data
- Page number footer shown at the bottom of Mushaf pages
- In stacked page scrolling, the next page starts directly after the separator line

## Project Layout

- `main.py`: FastAPI backend and API endpoints
- `new q/`: Next.js frontend (App Router, TypeScript, Tailwind, Zustand, TanStack Query)
- `download_quran.py`: Downloads the offline Quran dataset
- `quran_offline.json`: Offline Quran source data (rubs, pages, chapters)
- `start.bat`: Main Windows launcher for backend + frontend
- `state.json`: Stores the current rub pointer used by backend endpoints
- `output/backend-server/`: Backend runtime logs
- `new q/output/dev-server/`: Frontend runtime logs

## Requirements

- Python 3.10+
- Node.js 20.11.1+ (npm included)

Backend Python packages are listed in `requirements.txt`.

## Environment Variables

Create `.env` in the project root (see `.env.example`):

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
OAUTH_ENDPOINT=https://oauth2.quran.foundation

GOOGLE_AI_API_KEY=your_google_ai_key
GOOGLE_TAFSIR_ENHANCE_MODEL=gemma-3-27b-it
GROQ_API_KEY=your_groq_key
GROQ_TAFSIR_ENHANCE_MODEL=llama-3.3-70b-versatile
TAFSIR_ENHANCE_PROVIDER=auto

TAFSIR_ENHANCE_SHARED_SECRET=change-me
TAFSIR_ENHANCE_REQUIRE_LOOPBACK=true
TAFSIR_ENHANCE_MAX_TEXT_LENGTH=12000
TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS=60
TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS=8
```

For the Next.js app, `FASTAPI_BASE_URL` defaults to `http://127.0.0.1:8080` and can be overridden in `new q/.env.local`.

## Setup

1. Install backend dependencies:

```bash
python -m pip install -r requirements.txt
```

1. Install frontend dependencies:

```bash
cd "new q"
npm install
```

1. Ensure offline data exists (recommended):

```bash
python download_quran.py
```

If `quran_offline.json` is present, Quran content endpoints can keep working in offline mode.

## Run (Recommended on Windows)

From repo root:

```bat
start.bat
```

Then open:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8080`

The launcher also prints log file paths.

## Run Manually

Terminal 1 (backend):

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

Terminal 2 (frontend):

```bash
cd "new q"
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## API Overview

Main backend routes in `main.py`:

- `GET /api/rub`
- `POST /api/set_rub`
- `GET /api/page`
- `GET /api/page_recitation`
- `GET /api/page_word_timings`
- `GET /api/tafsir`
- `POST /api/tafsir_enhance`
- `GET /api/verse_audio`
- `GET /api/recitations`
- `GET /api/rub_recitation`
- `GET /api/rub_word_timings`
- `GET /api/status`

## Frontend Testing (Next.js App)

Run from `new q/`:

```bash
npm run test
npm run test:e2e
```

## Operational Notes

- Backend rub progress is persisted in `state.json`.
- Backend logs: `output/backend-server/uvicorn.out.log` and `output/backend-server/uvicorn.err.log`.
- Frontend logs: `new q/output/dev-server/next-dev.out.log` and `new q/output/dev-server/next-dev.err.log`.
- Additional frontend-specific notes are documented in `new q/README.md`.
