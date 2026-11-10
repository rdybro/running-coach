# CLAUDE.md

Personal, single-user AI running coach. Flow: Garmin personal API → SQLite → training context → OpenAI-compatible LLM (Mistral on Scaleway) → structured `CoachingAdvice` → React UI.

## Layout

- `api/`: FastAPI with raw `sqlite3`. Routes and the training context are in `main.py`, the Garmin client in `garmin.py`, the prompt and LLM client in `ai_service.py`, and the output schema (`CoachingAdvice`) in `ai_model.py`
- `frontend/`: React + Vite + lucide-react, plain CSS, no router. API calls are in `src/services/api.js`
- `compose.yaml`: deployment with prebuilt images from `ghcr.io/rdybro/`. nginx (`frontend/nginx.conf`) proxies `/api/` to the API

## Commands

- API: from the **repo root**, `uvicorn api.main:app --reload --env-file .env` (imports are `api.*`)
- Frontend: `cd frontend && npm run dev`, `npm run build`
- No tests or linters yet

## Rules

- Secrets come only from env vars. Never hardcode them, and never commit `.env` or `*.db`. `running_coach.db` holds real health data and a live Garmin token.
- `api/ai_model.py` is the source of truth for the `/coach` response. When it changes, update the frontend to match.
- The frontend calls the API under `/api/` (e.g. `/api/coach`). Vite and nginx strip the prefix, so the FastAPI routes themselves have no `/api`. New routes need no proxy changes.
- Single user: every profile and token query uses `id = 1`.
- `POST /coach` is limited to once per 24 h on purpose, because LLM calls cost money. Don't remove the limit, and don't call it repeatedly while testing.
- User-facing AI text must be in `user_profile.language` (passed as `response_language`).
- Keep the stack small (no ORM or framework additions) unless agreed first.

## Known issues / TODO

- Session type mismatch: `ai_model.py` uses `intensity_run`, while the frontend expects `quality_run`.
- `POST /coach` crashes when `ai_advice` is empty (`row` is `None`).
- Longest-run check: `get_longest_run` rounds the stored distance to whole metres, but `sync_garmin_data` compares the raw activity distance against it with `>=`. A slightly shorter run (e.g. 10020.2 m vs a stored 10020.4 m) can therefore replace the record and lower it. Replacing the date on an equal distance is intended, so the record stays fresh.
- The `api/Dockerfile` CMD runs `main:app` from inside `api/`, which doesn't match the `api.*` imports.
- No schema file exists, so a fresh clone can't create the database.
- `.env.example` doesn't list `DB_PATH`.
- The dropdowns (`<select>`) on the Settings page use the browser's default styling and should be made to fit the app's design. Not a priority right now.
- `update_personal_records` (`PUT /personal-records/{record_id}`) needs hardening, not a priority right now: an unknown id returns 200 instead of 404, `time_seconds` and `date` aren't validated, a record can't be cleared, and the `date` parameter shadows the `datetime.date` import.
