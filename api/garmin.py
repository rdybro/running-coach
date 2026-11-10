import os
import time
import sqlite3
import httpx
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "data/database.db")

GARMIN_API_KEY = os.environ["GARMIN_API_KEY"]
GARMIN_BASE_URL = os.getenv("GARMIN_BASE_URL", "https://personal.connectapi.garmin.com")

def get_garmin_token():
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT access_token, expires_at FROM garmin_token WHERE id = 1").fetchone()
        if row and row[1] > time.time():
            return row[0]
    with httpx.Client(timeout=30) as client:
        token_response = client.post(
            f"{GARMIN_BASE_URL}/personalapitoken-service/personal-api/personal-api-key/token",
            headers={"Authorization": f"ApiKey {GARMIN_API_KEY}"},
        )
    token_response.raise_for_status()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE garmin_token SET access_token = ?, expires_at = ? WHERE id = 1",
            (token_response.text, time.time() + (23 * 60 * 60))
        )
    return token_response.text

def get_garmin_activities():
    token = get_garmin_token()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT last_sync_at FROM garmin_token WHERE id = 1").fetchone()
    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{GARMIN_BASE_URL}/activitylist-service/activities/search/activities",
            headers={"Authorization": f"Bearer {token}"},
            params={"startDate": datetime.fromisoformat(row[0]).strftime("%Y-%m-%d")},
        )
        response.raise_for_status()
        return response.json()

def get_garmin_activity(garmin_activity_id: int):
    token = get_garmin_token()
    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{GARMIN_BASE_URL}/activity-service/activity/{garmin_activity_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()