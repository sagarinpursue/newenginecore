-- migrate:up

-- create realtime schema for Realtime RLS (WALRUS)
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- migrate:down
