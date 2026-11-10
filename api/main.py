from fastapi import FastAPI,HTTPException

import os
import sqlite3
import json
from datetime import datetime, timezone, date, timedelta

from api.garmin import get_garmin_activities,get_garmin_activity
from api.ai_service import get_ai_advice

DB_PATH = os.getenv("DB_PATH", "data/database.db")

app = FastAPI()

@app.post("/garmin-data")
def sync_garmin_data():
    count_processed_activities = 0
    garmin_activities = get_garmin_activities()
    longest_run = get_longest_run()
    for activity in garmin_activities:
        activity_details = get_garmin_activity(activity["activityId"])
        count_processed_activities += 1
        started_at = datetime.strptime(activity["startTimeGMT"],"%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT INTO activities (garmin_activity_id, name, activity_type, started_at, distance_meters, duration_seconds, avg_heart_rate, max_heart_rate, aerobic_training_effect, anaerobic_training_effect, feel, perceived_effort)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(garmin_activity_id) DO UPDATE SET
                    name = excluded.name,
                    activity_type = excluded.activity_type,
                    started_at = excluded.started_at,
                    distance_meters = excluded.distance_meters,
                    duration_seconds = excluded.duration_seconds,
                    avg_heart_rate = excluded.avg_heart_rate,
                    max_heart_rate = excluded.max_heart_rate,
                    aerobic_training_effect = excluded.aerobic_training_effect,
                    anaerobic_training_effect = excluded.anaerobic_training_effect,
                    feel = excluded.feel,
                    perceived_effort = excluded.perceived_effort
            """, (
                activity["activityId"],
                activity.get("activityName"),
                activity.get("activityType", {}).get("typeKey"),
                started_at.isoformat(),
                activity.get("distance"),
                activity.get("duration"),
                activity.get("averageHR"),
                activity.get("maxHR"),
                activity.get("aerobicTrainingEffect"),
                activity.get("anaerobicTrainingEffect"),
                activity_details.get("summaryDTO", {}).get("directWorkoutFeel"),
                activity_details.get("summaryDTO", {}).get("directWorkoutRpe")
            ))
        # Only runs count (running, trail_running, treadmill_running, virtual_run, ...)
        type_key = activity.get("activityType", {}).get("typeKey") or ""
        distance = activity.get("distance") or 0
        if "run" in type_key and distance >= (longest_run["distance_meters"] or 0):
            longest_run = update_longest_run(distance, started_at.isoformat())
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE garmin_token SET last_sync_at = ? WHERE ID = 1",
            (datetime.now(timezone.utc).isoformat(),)
        )
    return {"status": "ok", "processed_activities": count_processed_activities}

@app.get("/training-context")
def build_training_context():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        user_profile = conn.execute("SELECT date_of_birth, sex, language, goal_name, goal_event, goal_distance_meters, goal_target_time_seconds, goal_date FROM user_profile WHERE id = 1").fetchone()
        recent_activities = conn.execute("SELECT garmin_activity_id, name, activity_type, started_at, ROUND(distance_meters,0), ROUND(duration_seconds,0), avg_heart_rate, max_heart_rate, ROUND(aerobic_training_effect,1), ROUND(anaerobic_training_effect,1), feel, perceived_effort, ROUND(duration_seconds / (distance_meters / 1000.0),0) AS pace_seconds_per_km FROM activities WHERE activity_type IN ('running','strength_training','indoor_cardio') ORDER BY started_at DESC LIMIT 10").fetchall()
    date_of_birth = date.fromisoformat(user_profile["date_of_birth"])
    today = date.today()
    age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
    recent_activities = [dict(row) for row in recent_activities]
    longest_run = get_longest_run()
    personal_records = get_personal_records()
    return {
        "profile": {"age": age, "sex": user_profile["sex"], "response_language": user_profile["language"],
            "goal": {"goal_name": user_profile["goal_name"], "goal_event": user_profile["goal_event"], "goal_distance_meters": user_profile["goal_distance_meters"], "goal_target_time_seconds": user_profile["goal_target_time_seconds"], "goal_date": user_profile["goal_date"], "goal_days_remaining": (date.fromisoformat(user_profile["goal_date"]) - date.today()).days},
            "longest_run": longest_run,
            "personal_records": personal_records
        },
        "last_10_activities": recent_activities,
        "summary_past_7_days": get_training_summary(7),
        "summary_past_14_days": get_training_summary(14),
        "summary_past_28_days": get_training_summary(28),
        "summary_past_42_days": get_training_summary(42),
        "feedback_scales": {
            "feel": {"min": 0, "max": 100, "direction": "higher_is_better"},
            "perceived_effort": {"min": 0, "max": 100, "direction": "higher_is_harder"}
        }
    }

def get_training_summary(days):
    days -= 1
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        runs = conn.execute("""
            SELECT
                COUNT(*) AS runs,
                ROUND(SUM(distance_meters) / 1000.0,2) AS distance_km,
                ROUND(SUM(duration_seconds),0) AS duration_seconds,
                ROUND(SUM(duration_seconds) / NULLIF(SUM(distance_meters) / 1000.0, 0),0) AS avg_pace_seconds_per_km,
                ROUND(MAX(distance_meters) / 1000.0,2) AS longest_run_km
            FROM activities
            WHERE
                activity_type = 'running'
                AND started_at >= datetime('now', ?, 'start of day')
        """, (f"-{days} days",)).fetchone()
        strength_training_sessions = conn.execute("""
            SELECT
                COUNT(*) AS strength_training_sessions,
                ROUND(SUM(duration_seconds),0) AS duration_seconds
            FROM activities
            WHERE
                activity_type = 'strength_training'
                AND started_at >= datetime('now', ?, 'start of day')
        """, (f"-{days} days",)).fetchone()
        cardio_sessions = conn.execute("""
            SELECT
                COUNT(*) AS cardio_sessions,
                ROUND(SUM(duration_seconds),0) AS duration_seconds
            FROM activities
            WHERE
                activity_type = 'indoor_cardio'
                AND started_at >= datetime('now', ?, 'start of day')
            """, (f"-{days} days",)).fetchone()
    return {"runs": dict(runs), "strength_training": dict(strength_training_sessions), "cardio": dict(cardio_sessions)}

@app.get("/coach")
def get_coaching_advice():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT created_at, prompt, response FROM ai_advice ORDER BY created_at DESC LIMIT 1").fetchone()
    if row is None:
        return {"created_at": None, "training_context": None, "ai_advice": None}
    return {"created_at": row["created_at"], "training_context": json.loads(row["prompt"]), "ai_advice": json.loads(row["response"])}

@app.post("/coach")
def update_coaching_advice():
    created_at = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT created_at FROM ai_advice ORDER BY created_at DESC LIMIT 1").fetchone()
    retry_after = datetime.fromisoformat(row["created_at"]) + timedelta(hours=24)
    if retry_after > datetime.fromisoformat(created_at):
        raise HTTPException(status_code=429,detail="Too many requests.")
    training_context = build_training_context()
    ai_advice = get_ai_advice(training_context)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO ai_advice (created_at, prompt, response)
            VALUES (?, ?, ?)
        """,(
            created_at,
            json.dumps(training_context, ensure_ascii=False),
            json.dumps(ai_advice, ensure_ascii=False)
        ))
    return {"created_at": created_at, "training_context": training_context, "ai_advice": ai_advice}

@app.get("/settings", tags=["user"])
def get_settings():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        user = conn.execute("SELECT date_of_birth, sex, language, goal_name, goal_event, goal_distance_meters, goal_target_time_seconds, goal_date FROM user_profile WHERE id = 1").fetchone()
    return user

@app.put("/settings", tags=["user"])
def update_settings(date_of_birth: str, sex: str, language: str, goal_name: str, goal_event: str, goal_distance_meters: int, goal_target_time_seconds: int, goal_date: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE user_profile SET date_of_birth = ?, sex = ?, language = ?, goal_name = ?, goal_event = ?, goal_distance_meters = ?, goal_target_time_seconds = ?, goal_date = ? WHERE ID = 1",
            (date_of_birth, sex, language, goal_name, goal_event, goal_distance_meters, goal_target_time_seconds, goal_date)
        )
    return get_settings()

@app.get("/longest-run", tags=["user"])
def get_longest_run():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        longest_run = conn.execute("SELECT ROUND(longest_run_distance_meters,0) AS longest_run_distance_meters, longest_run_date FROM user_profile WHERE id = 1").fetchone()
    return {"distance_meters": longest_run["longest_run_distance_meters"], "date": longest_run["longest_run_date"]}

@app.put("/longest-run", tags=["user"])
def update_longest_run(distance_meters: int, date: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE user_profile SET longest_run_distance_meters = ?, longest_run_date = ? WHERE ID = 1",
            (distance_meters, date)
        )
    return get_longest_run()

@app.get("/personal-records", tags=["user"])
def get_personal_records():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT id, name, distance_meters, time_seconds, date FROM personal_records ORDER BY distance_meters ASC").fetchall()
    return [dict(row) for row in rows]

@app.put("/personal-records/{record_id}", tags=["user"])
def update_personal_records(record_id: int, time_seconds: int, date: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE personal_records SET time_seconds = ?, date = ? WHERE id = ?",
            (time_seconds, date, record_id)
        )
    return get_personal_records()

@app.get("/health", tags=["health"])
def health_check():
    try:
        with sqlite3.connect(DB_PATH, timeout=5) as conn:
            conn.execute("SELECT 1")
            required_tables = {"activities", "garmin_token"}
            existing_tables = {
                row[0] for row in conn.execute("""
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                """).fetchall()
            }
            missing_tables = required_tables - existing_tables
            if missing_tables:
                raise Exception("Missing database tables")
            return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Service unavailable")
