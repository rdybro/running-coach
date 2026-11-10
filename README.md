# Running Coach

A personal, single-user AI running coach. It syncs activities from the Garmin personal API into SQLite, asks an OpenAI-compatible LLM for structured coaching advice, and shows it in a small mobile-first React app.

## Setup

Copy `.env.example` to `.env` and fill in `GARMIN_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` and `OPENAI_MODEL`. `.env` and the database are git-ignored.

## Run locally

API, from the repo root:

```bash
pip install -r api/requirements.txt
uvicorn api.main:app --reload --env-file .env
```

API docs: <http://127.0.0.1:8000/docs>

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Docker

```bash
docker compose up -d
```

The UI is served on <http://localhost:8080>.
