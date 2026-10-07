CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  model_type TEXT NOT NULL CHECK (model_type IN ('closed', 'open')),
  input_price REAL NOT NULL,
  output_price REAL NOT NULL,
  intelligence REAL,
  hle REAL,
  gdpval REAL,
  automation REAL,
  scicode REAL,
  terminal_model REAL,
  deepswe REAL,
  terminal_harness REAL,
  swe_atlas REAL,
  tokens_per_task REAL,
  cost_per_task REAL,
  harness TEXT,
  tag TEXT,
  note TEXT,
  display_order INTEGER NOT NULL,
  data_date TEXT NOT NULL
);
