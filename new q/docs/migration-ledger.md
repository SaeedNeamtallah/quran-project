# Migration Ledger

This ledger tracks parity between the legacy frontend and the new Next.js implementation.

| Feature | Legacy Source | New Surface | Status | Acceptance |
| --- | --- | --- | --- | --- |
| Timer core | `static/script.js` | `/focus` + `timerStore` | In progress | Start, pause, reset, skip, phase transition |
| Study -> break routing | `static/script.js` | `AppRuntime` | In progress | Switches to last reader route on break |
| Break -> study routing | `static/script.js` | `AppRuntime` | In progress | Returns to `/focus` on study |
| Rub reading | `main.py` + `static/script.js` | `/reader/rub` | In progress | Renders current rub sequence with progress |
| Removed modes redirect | `static/script.js` | `/reader/challenge` + `/reader/page` -> `/reader/rub` | Translated + tested | Old links redirect cleanly to the remaining reader mode |
| Reader typography controls | `static/index.html` + `static/script.js` | Reader toolbar | In progress | Font size persists |
| Reader focus mode | `static/script.js` | `/reader/rub` focus toggle | Translated + tested | Hides extra chrome and keeps reading navigation available |
| Tafsir page | `static/tafsir.html` + `static/tafsir.js` | `/tafsir/[verseKey]` | Translated + tested | Loads, navigates, and keeps structured tafsir headings/paragraphs |
| Tafsir enhancement | `main.py` + `static/tafsir.js` | Tafsir page enhance action | Translated + tested | Works when backend is available and rewrites content into readable segments |
| Verse audio | `main.py` + `static/script.js` | Reader verse actions | Translated + tested | Plays selected verse audio and exposes active playback state |
| Rub recitation | `main.py` + `static/script.js` | Reader recitation panel | Translated + tested | Plays rub playlist and updates recitation state cleanly |
| Word timings | `main.py` + `static/script.js` | Reader word highlighting | Translated + tested | Active word follows recitation timing with visible tracking indicators |
| Settings persistence | `static/script.js` | `/settings` + `settingsStore` | In progress | Settings survive reload |
| Reader position controls | `static/script.js` | `/settings` + `readerStore` | Translated + tested | Current rub can be edited and applied |
| Stats persistence | `static/script.js` | `/stats` + `statsStore` | In progress | Pomodoros and rubs accumulate correctly |
| Theme switching | `static/style.css` + `static/script.js` | Global theme runtime | In progress | RTL themes switch without layout breakage |
| Notifications/alarm | `static/script.js` + `alarm.m4a` | `AppRuntime` + `/focus` | In progress | Notification/alarm on timed transition |
| Offline Quran fallback | `quran_offline.json` | `/api/offline-quran` + client fallback | In progress | Reading works with backend unavailable |

## Backend Backlog

- Fix wrapped rub range labels around the `240 -> 1` boundary.
- Retry resource caches after transient backend failures.
- Review state and concurrency assumptions in `main.py`.
- Expand backend hardening beyond the current `tafsir_enhance` guardrails if public auth is introduced later.

## Current Automated Coverage

- Utility tests cover formatting helpers, verse routing, and normalization.
- Store tests cover settings persistence, reader progress, stats accumulation, and timer transitions.
- API-client tests cover offline fallback for rub reads and cached verse-sequence loading.
- Route-handler tests cover backend status fallback plus `rub`/`set_rub` proxy behavior and the `tafsir`/audio/tracking proxy routes with mocked FastAPI responses.
- Playwright tests cover the main shell navigation, focus-to-reader transition, removed-route redirects, settings persistence, reader-position controls, reader focus mode, tafsir fallback, structured tafsir rendering/enhancement/navigation, stats reset behavior, and backend-mocked verse audio/rub recitation/word-highlighting flows.

## Runtime Notes

- Next.js development and production artifacts are intentionally split: `.next-dev` for `npm run dev`, `.next-prod` for `npm run build` and `npm run start`.
- This avoids dev-server writes corrupting the production bundle that Playwright boots on `127.0.0.1:3001`.
- Reader navigation waits for the persisted reader store to hydrate before enabling rub controls, which prevents stale local state from overwriting in-session navigation.
