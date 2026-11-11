-- Database schema. Runs on every startup, so every statement must be idempotent.

CREATE TABLE IF NOT EXISTS "activities" (
	"garmin_activity_id"	INTEGER NOT NULL UNIQUE,
	"name"	TEXT,
	"activity_type"	TEXT NOT NULL,
	"started_at"	TEXT NOT NULL,
	"distance_meters"	NUMERIC,
	"duration_seconds"	INTEGER,
	"avg_heart_rate"	INTEGER,
	"max_heart_rate"	INTEGER,
	"aerobic_training_effect"	NUMERIC,
	"anaerobic_training_effect"	NUMERIC,
	"feel"	INTEGER,
	"perceived_effort"	INTEGER,
	PRIMARY KEY("garmin_activity_id")
);

CREATE TABLE IF NOT EXISTS "ai_advice" (
	"id"	INTEGER NOT NULL UNIQUE,
	"created_at"	TEXT NOT NULL,
	"system_prompt"	TEXT,
	"prompt"	TEXT NOT NULL,
	"response"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "garmin_token" (
	"id"	INTEGER CHECK("id" = 1),
	"access_token"	TEXT NOT NULL,
	"expires_at"	INTEGER NOT NULL,
	"last_sync_at"	TEXT,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "personal_records" (
	"id"	INTEGER NOT NULL UNIQUE,
	"name"	TEXT,
	"distance_meters"	INTEGER,
	"time_seconds"	INTEGER,
	"date"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "user_profile" (
	"id"	INTEGER CHECK("id" = 1),
	"date_of_birth"	TEXT,
	"sex"	TEXT,
	"language"	TEXT NOT NULL DEFAULT 'english',
	"goal_name"	TEXT,
	"goal_event"	TEXT,
	"goal_distance_meters"	INTEGER,
	"goal_target_time_seconds"	INTEGER,
	"goal_date"	TEXT,
	"longest_run_distance_meters"	INTEGER,
	"longest_run_date"	TEXT,
	PRIMARY KEY("id")
);

-- Seed rows. INSERT OR IGNORE leaves existing rows untouched.

INSERT OR IGNORE INTO "user_profile" ("id") VALUES (1);

-- Expired placeholder token, so the first sync fetches a real one.
-- The first sync fetches the last 42 days, matching the longest training summary.
INSERT OR IGNORE INTO "garmin_token" ("id", "access_token", "expires_at", "last_sync_at")
VALUES (1, '', 0, datetime('now', '-42 days'));

INSERT OR IGNORE INTO "personal_records" ("id", "name", "distance_meters") VALUES
	(1, '1 km', 1000),
	(2, '1 mile', 1609),
	(3, '5K', 5000),
	(4, '10K', 10000),
	(5, 'Half Marathon', 21098),
	(6, 'Marathon', 42195);
