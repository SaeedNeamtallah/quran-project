# Quranic Pomodoro Next

Parallel migration of the current Quranic Pomodoro frontend into:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

## Development Notes

- The legacy FastAPI app remains the backend of record during phase 1.
- The new app lives in `new q/` and does not replace the old frontend until parity is complete.
- Quran offline data stays in the repo root as the single source and is read through server route handlers.

## Planned Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
```

`npm run dev` now writes to `.next-dev`, while `npm run build` and `npm run start` use `.next-prod`. This keeps the local review server on `127.0.0.1:3000` isolated from production build artifacts used by Playwright on `127.0.0.1:3001`.

## Expected Environment

Set a local env value when running the new app:

```env
FASTAPI_BASE_URL=http://127.0.0.1:8080
TAFSIR_ENHANCE_SHARED_SECRET=change-me-before-public-deploy
TAFSIR_ENHANCE_MAX_TEXT_LENGTH=12000
TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS=60
TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS=8
NEXT_PUBLIC_SITE_URL=https://your-app-name.azurewebsites.net
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
```

The same `TAFSIR_ENHANCE_SHARED_SECRET` should be configured in the FastAPI backend environment when you want the Next.js proxy to sign enhancement requests.

For Azure App Service deployment, set `NEXT_PUBLIC_SITE_URL` to your production HTTPS domain so canonical URLs, `robots.txt`, and `sitemap.xml` are generated correctly.

## Test Coverage

- Utility coverage for formatting, normalization, verse helpers, and structured tafsir parsing
- Store coverage for settings, reader progress, stats, and timer behavior
- API-client coverage for offline fallback and cached verse-sequence loading
- Route-handler coverage for `status`, `rub`, `set_rub`, `tafsir`, `tafsir_enhance`, `recitations`, `verse_audio`, `rub_recitation`, and `rub_word_timings`
- Playwright coverage for navigation, focus flow, removed-route redirects, settings persistence, reader-position controls, reader focus mode, tafsir fallback state, structured tafsir rendering/enhancement/navigation, stats reset, and backend-mocked reader audio/word-tracking flows
