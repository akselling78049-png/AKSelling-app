/*
# Twilio SMS Configuration

## Overview
Creates a secure table to store SMS gateway (Twilio) credentials for the
send-sms edge function. The edge function reads these credentials at runtime
to send order confirmation SMS messages.

## New Tables

### sms_config
Stores Twilio API credentials. Only one row should exist (id = 1).
- id (int, PK, always 1)
- account_sid (text) — Twilio Account SID
- auth_token (text) — Twilio Auth Token
- from_number (text) — Twilio sender phone number
- created_at (timestamptz)

## Security (RLS)
- No SELECT/INSERT/UPDATE/DELETE for anon or authenticated roles.
  The edge function uses the service role key which bypasses RLS,
  so it can read the credentials. Browser clients cannot access this table.
*/

CREATE TABLE IF NOT EXISTS sms_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  account_sid text NOT NULL,
  auth_token text NOT NULL,
  from_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;

-- No policies: table is locked from anon/authenticated.
-- Edge function uses service role key (bypasses RLS) to read.

-- Insert the Twilio credentials
INSERT INTO sms_config (id, account_sid, auth_token, from_number)
VALUES (1, 'ACa79eefe71d8d3f25983a5517f33473dd', 'WHfYIsp9nzCQwH7nQsHnwrQVpx7bwZeo', '+17372508034')
ON CONFLICT (id) DO UPDATE SET
  account_sid = EXCLUDED.account_sid,
  auth_token = EXCLUDED.auth_token,
  from_number = EXCLUDED.from_number;