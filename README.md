# Running Coach

A personal, single-user AI running coach. It syncs activities from the Garmin personal API into SQLite, builds a training context (recent activities, 7/14/28/42-day summaries, goal), asks an OpenAI-compatible LLM for structured coaching advice, and shows it in a small mobile-first React app.

## Requirements

- Python 3.12
- Node.js 18+
- A Garmin personal API key and an OpenAI-compatible LLM endpoint (currently Mistral Small on Scaleway)

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `GARMIN_API_KEY` | Garmin personal API key |
| `OPENAI_API_KEY` | Key for the LLM endpoint |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL |
| `OPENAI_MODEL` | Model name, e.g. `mistral-small-3.2-24b-instruct-2506` |

`.env` and the SQLite database are git-ignored. Never commit them.

## Run locally

API (run from the repo root, since modules are imported as `api.*`):

```bash
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1   macOS/Linux: source .venv/bin/activate
pip install -r api/requirements.txt
uvicorn api.main:app --reload
```

API docs: <http://127.0.0.1:8000/docs>

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Vite serves on <http://localhost:5173> and proxies `/coach` and `/personal-records` to the API on port 8000. `npm run build` writes the static site to `frontend/dist/`.

## Docker

```bash
docker compose up -d
```

Pulls `ghcr.io/rdybro/running-coach-api` and `ghcr.io/rdybro/running-coach-frontend`. The UI is served on <http://localhost:8080>, and nginx proxies `/coach` and `/personal-records` to the API. Data is mounted from `./data`.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/garmin-data` | Sync new Garmin activities since the last sync |
| `GET` | `/coach` | Latest stored coaching advice |
| `POST` | `/coach` | Generate new advice (max once per 24 h) |
| `GET` | `/training-context` | The context sent to the LLM |
| `GET` / `PUT` | `/settings` | User profile and goal |
| `GET` / `PUT` | `/longest-run` | Longest run record |
| `GET` | `/personal-records` | Personal records |
| `PUT` | `/personal-records/{id}` | Update a record's time and date (JSON body `{"time_seconds", "date"}`; both `null` clears it) |
| `GET` | `/health` | Health check |

## `/coach` response contract

`GET /coach` and `POST /coach` return the same structure. The frontend reads the goal from `training_context.profile.goal` and the coaching advice from `ai_advice`. If this changes, update `api/ai_model.py`, the frontend and this section together.

```json
{
  "created_at": "2026-11-02T21:17:29.488098+00:00",
  "training_context": {
    "profile": {
      "response_language": "english",
      "goal": {
        "goal_name": "Aalborg Halvmarathon",
        "goal_distance_meters": 21097,
        "goal_target_time_seconds": 7200,
        "goal_date": "2027-05-02",
        "goal_days_remaining": 181
      }
    }
  },
  "ai_advice": {
    "goal_progress": {
      "score": 75,
      "trend": "stable",
      "explanation": "Progress is appropriate for the current training phase."
    },
    "feedback_on_last_run": "A controlled easy run with a steady heart rate.",
    "recommended_sessions": [
      {
        "type": "easy_run",
        "distance_km": 8,
        "duration_minutes": 45,
        "description": "Keep the effort comfortable and conversational."
      },
      {
        "type": "strength",
        "distance_km": null,
        "duration_minutes": 30,
        "description": "A short, controlled full-body strength session."
      }
    ],
    "plan_adjustments": ["Move the long run to Sunday to allow recovery after Thursday's intervals."],
    "warning": null
  }
}
```

- `recommended_sessions`: at most 3. Supported `type` values: `easy_run`, `quality_run`, `long_run`, `strength`.
- `warning`: `null` or a string. When set, it is shown as a red card at the top of the dashboard.

## Database

SQLite with the tables `activities`, `garmin_token`, `ai_advice`, `user_profile` and `personal_records`. The database is not committed, and there is no schema file or migration yet. A fresh setup currently needs the tables created manually.
