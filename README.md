# Quranic Pomodoro

Quranic Pomodoro is a small Arabic-first Pomodoro app with two delivery modes:

- A local FastAPI web app served from `main.py` and `static/`
- A Chrome extension in `chrome-extension/` that reads bundled offline Quran data

The project mixes focus sessions with Quran reading during breaks. It supports three reading modes:

- Sequential rubs
- Surah challenge mode
- Mushaf page mode

## Project Layout

- `main.py`: FastAPI backend and API endpoints for rub/page/surah content
- `static/`: Web UI (`index.html`, `script.js`, `style.css`, `alarm.m4a`)
- `download_quran.py`: Downloads offline Quran content into `quran_offline.json`
- `quran_offline.json`: Main offline Quran dataset used by the web app
- `chrome-extension/`: Chrome extension files and its bundled offline dataset copy
- `setup_extension.py`: Prepares extension assets and copies offline data
- `setup_extension.bat`: Windows helper for extension setup
- `start.bat`: Windows helper to install dependencies and run the web app
- `create_shortcut.bat`: Creates a desktop shortcut to `start.bat`
- `state.json`: Stores the current rub position for the web app

## Requirements

- Python 3.10+
- Google Chrome for the extension workflow
- Internet access for the first data download unless `quran_offline.json` already exists

Python packages:

- `fastapi`
- `uvicorn`
- `python-dotenv`
- `requests`

## Environment Variables

Create a `.env` file in the project root with:

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
OAUTH_ENDPOINT=https://oauth2.quran.foundation
```

A ready-to-copy template is included in `.env.example`.

## Setup

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Download offline Quran data:

```bash
python download_quran.py
```

This creates `quran_offline.json`. When that file exists, the web app runs in offline mode for Quran content.

## Run The Web App

Option 1:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

Then open:

```text
http://127.0.0.1:8080/
```

Option 2 on Windows:

```bat
start.bat
```

## GitHub Pages

GitHub Pages can only host the static version of this project, not the FastAPI backend.

This repo is now prepared so the same UI can work in two modes:

- Local mode: uses FastAPI endpoints when the backend is available
- GitHub Pages mode: falls back automatically to `quran_offline.json` in the browser

Deployment workflow:

1. Make sure `quran_offline.json` exists in the repo root
2. Commit and push the repo to GitHub
3. In GitHub, open `Settings -> Pages`
4. Set `Source` to `GitHub Actions`
5. Push to `main` or `master`, or run the `Deploy GitHub Pages` workflow manually

The workflow file is:

- `.github/workflows/pages.yml`

After deployment, your site URL will usually look like:

```text
https://<your-username>.github.io/<your-repo>/
```

## Web App Features

- Focus timer and Quran break timer
- Sequential rub reading
- Surah challenge pagination
- Mushaf page reading
- Theme switching
- Basic local stats stored in `localStorage`
- Optional alarm audio

## Chrome Extension Setup

Prepare the extension bundle:

```bash
python setup_extension.py
```

Or on Windows:

```bat
setup_extension.bat
```

Then load it in Chrome:

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `chrome-extension` folder

## Chrome Extension Notes

- The extension is fully offline for Quran text once `chrome-extension/quran_offline.json` is present
- Timer state and stats are stored in `chrome.storage.local`
- The service worker handles notifications when the popup window is closed

## Data Flow

1. `download_quran.py` fetches Quran content from the Quran Foundation API
2. The downloader writes `quran_offline.json`
3. `main.py` loads that file for the web app
4. `setup_extension.py` or `setup_extension.bat` copies the dataset into `chrome-extension/quran_offline.json`

## Known Operational Notes

- The web app keeps rub progress in `state.json`
- The web frontend and the Chrome extension use separate state stores
- The extension currently bundles its own copy of the Quran dataset instead of reading the root file directly

## Quick Start

```bash
python -m pip install -r requirements.txt
python download_quran.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
```
