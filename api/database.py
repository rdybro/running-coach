import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", "data/database.db")
SCHEMA_PATH = Path(__file__).with_name("schema.sql")

def init_db():
    # Creates missing tables and seed rows. Existing tables and rows are left untouched.
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
