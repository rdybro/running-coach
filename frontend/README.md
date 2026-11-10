# Running Coach frontend

A small mobile-first React/Vite frontend for the FastAPI running-coach API.

## Requirements

- Node.js 18 or newer
- FastAPI backend

## Run locally

```bash
npm install
npm run dev
```

Vite serves the app at http://localhost:5173 and proxies `/coach` to `http://127.0.0.1:8000`.

## API contract

The frontend expects both `GET /coach` and `POST /coach` to return the same response structure:

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
    "plan_adjustments": [],
    "warning": null
  }
}
```

The frontend reads the goal from `training_context.profile.goal` and coaching advice from `ai_advice`. It does not contain mock data or a demo mode.

Supported session types: `easy_run`, `quality_run`, `long_run`, `strength`.

## Production build

```bash
npm run build
```

The generated static site is written to `dist/`.
