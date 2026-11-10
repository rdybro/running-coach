# CLAUDE.md

Personal, single-user AI running coach. Flow: Garmin personal API → SQLite → training context → OpenAI-compatible LLM (Mistral on Scaleway) → structured `CoachingAdvice` → React UI.

## Layout

- `api/`: FastAPI using raw `sqlite3` (no ORM, no migrations)
  - `main.py`: all routes, the training-context builder and the SQL summaries
  - `garmin.py`: Garmin API client. The bearer token is cached in the `garmin_token` table (row `id = 1`), along with `last_sync_at`
  - `ai_service.py`: the system prompt and the OpenAI client (`chat.completions.parse` with a Pydantic response format)
  - `ai_model.py`: Pydantic output schema (`CoachingAdvice`)
- `frontend/`: React 18 + Vite + lucide-react, plain CSS (`src/styles.css`). There is no router: `App.jsx` switches between `Dashboard` and `Settings` via state. API calls are in `src/services/api.js`
- `compose.yaml`: deployment using prebuilt images from `ghcr.io/rdybro/running-coach-{api,frontend}:latest`. nginx (`frontend/nginx.conf`) proxies `/coach` to `api:8000`

## Commands

- API: from the **repo root**, `uvicorn api.main:app --reload` (imports are `api.*`; the venv is `.venv`)
- Frontend: `cd frontend && npm run dev` (proxies `/coach` to :8000), `npm run build`
- No tests or linters are set up yet

## Rules

- Secrets come only from env vars (`GARMIN_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`). Never hardcode them, and never commit `.env` or `*.db`. `running_coach.db` holds real health data and a live Garmin token.
- The `/coach` response contract is documented in `frontend/README.md`. When it changes, update the backend schema, the frontend and that doc together.
- Single user: every profile and token query uses `id = 1`.
- `POST /coach` is limited to once per 24 h on purpose, because LLM calls cost money. Don't remove the limit, and don't call it repeatedly while testing.
- User-facing AI text must be in `user_profile.language` (passed as `response_language`).
- Keep the stack small (no ORM or framework additions) unless agreed first.

## Known issues / TODO

- Session type mismatch: `ai_model.py` uses `intensity_run`, while the frontend and its docs expect `quality_run`.
- `personal_bests` is hardcoded in `build_training_context`, even though a `personal_records` table exists.
- `POST /coach` crashes when `ai_advice` is empty (`row` is `None`).
- In `sync_garmin_data`, `update_longest_run` is passed the old record distance instead of the activity's distance.
- `DB_PATH` is hardcoded to `running_coach.db` in `main.py` and `garmin.py`, so the `DB_PATH` set in compose is ignored.
- The `api/Dockerfile` CMD runs `main:app` from inside `api/`, which doesn't match the `api.*` imports.
- No schema file exists, so a fresh clone can't create the database.
- The Settings page doesn't call the API yet, and only `/coach` is proxied (Vite and nginx).
- `.env.example` still contains a stale `DATABASE_URL` line and doesn't list `DB_PATH`.
