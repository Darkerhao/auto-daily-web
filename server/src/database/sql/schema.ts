export const schemaSql = `
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  branch TEXT NOT NULL,
  token TEXT NOT NULL,
  sync_frequency TEXT NOT NULL,
  last_sync_at TEXT NOT NULL,
  owner TEXT NOT NULL,
  commit_count_today INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  markdown TEXT NOT NULL,
  style TEXT NOT NULL,
  commit_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_cost INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  push_status TEXT NOT NULL,
  risk_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  tomorrow_plan JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS commits (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  short_hash TEXT NOT NULL,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  time TEXT NOT NULL,
  branch TEXT NOT NULL,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  files JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE commits
ADD COLUMN IF NOT EXISTS repo_id TEXT NOT NULL DEFAULT 'repo-1';

CREATE TABLE IF NOT EXISTS model_settings (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  max_tokens INTEGER NOT NULL,
  enable_streaming BOOLEAN NOT NULL,
  merge_duplicate_commits BOOLEAN NOT NULL,
  default_style TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feishu_settings (
  id TEXT PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  bot_secret TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  app_id TEXT NOT NULL DEFAULT '',
  app_secret TEXT NOT NULL DEFAULT '',
  auto_send_time TEXT NOT NULL,
  enable_robot BOOLEAN NOT NULL,
  enable_doc_sync BOOLEAN NOT NULL
);

ALTER TABLE feishu_settings
ADD COLUMN IF NOT EXISTS app_id TEXT NOT NULL DEFAULT '';

ALTER TABLE feishu_settings
ADD COLUMN IF NOT EXISTS app_secret TEXT NOT NULL DEFAULT '';
`
