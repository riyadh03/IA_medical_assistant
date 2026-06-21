import sqlite3
import json
import os

# SQLite database file path (persisted in workspace data directory)
DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
DB_PATH = os.path.join(DB_DIR, "medical.db")

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow (
            workflow_id TEXT PRIMARY KEY,
            patient_name TEXT,
            patient_age INTEGER,
            patient_gender TEXT,
            chief_complaint TEXT,
            status TEXT,
            current_question_index INTEGER,
            question_answers TEXT,
            diagnostic_summary TEXT,
            interim_care TEXT,
            physician_review TEXT,
            final_report TEXT
        )
    """)
    conn.commit()
    conn.close()
    print(f"🗄️ [Database] Base de données initialisée à {DB_PATH}")

def save_workflow(state: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow (
            workflow_id, patient_name, patient_age, patient_gender, chief_complaint,
            status, current_question_index, question_answers,
            diagnostic_summary, interim_care, physician_review, final_report
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(workflow_id) DO UPDATE SET
            status=excluded.status,
            current_question_index=excluded.current_question_index,
            question_answers=excluded.question_answers,
            diagnostic_summary=excluded.diagnostic_summary,
            interim_care=excluded.interim_care,
            physician_review=excluded.physician_review,
            final_report=excluded.final_report
    """, (
        state.get("workflow_id"),
        state.get("patient_name"),
        state.get("patient_age"),
        state.get("patient_gender"),
        state.get("chief_complaint"),
        state.get("status"),
        state.get("question_count", 0),
        json.dumps(state.get("question_answers", [])),
        state.get("diagnostic_summary"),
        state.get("interim_care"),
        state.get("physician_review"),
        state.get("final_report")
    ))
    conn.commit()
    conn.close()

def get_workflow(workflow_id: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workflow WHERE workflow_id = ?", (workflow_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["question_answers"] = json.loads(res["question_answers"])
        return res
    return None

def list_workflows() -> list:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Retrieve all rows ordered by rowid DESC (most recent first)
    cursor.execute("SELECT * FROM workflow ORDER BY rowid DESC")
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for row in rows:
        d = dict(row)
        d["question_answers"] = json.loads(d["question_answers"])
        res.append(d)
    return res
