-- Dali SQLite Schema

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL CHECK(status IN ('open', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  source_task_id TEXT,
  rollover_count INTEGER NOT NULL DEFAULT 0,
  reminder_at TEXT,
  recurrence_rule_id TEXT,
  FOREIGN KEY(source_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS task_events (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- created, completed, reopened, moved, rolled_over, deleted
  from_date TEXT,
  to_date TEXT,
  created_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recurrence_rules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL, -- daily, weekdays, weekly, monthly
  interval INTEGER NOT NULL DEFAULT 1,
  weekdays TEXT, -- JSON array of day numbers
  month_day INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  reminder_at TEXT,
  created_at TEXT NOT NULL
);
