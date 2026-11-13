import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", "data/database.db")
SCHEMA_PATH = Path(__file__).with_name("schema.sql")

ADDED_COLUMNS = [
    ("ai_advice", "openai_model", "TEXT"),
]

def init_db():
    # Creates missing tables and seed rows. Existing tables and rows are left untouched.
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        for table, column, col_type in ADDED_COLUMNS:
            existing = {row[1] for row in conn.execute(f'PRAGMA table_info("{table}")')}
            if column not in existing:
                conn.execute(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {col_type}')