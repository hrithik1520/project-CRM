#!/bin/bash
# CRM local dev startup script

PG_BIN=/home/hrithik/.npm/_npx/43414d9b790239bb/node_modules/@embedded-postgres/linux-x64/native/bin
PG_DATA=/home/hrithik/.crm-pg-data

# Start PostgreSQL if not running
if ! $PG_BIN/pg_ctl -D $PG_DATA status > /dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  $PG_BIN/pg_ctl -D $PG_DATA -o "-p 5433" -l /tmp/crm-pg.log start
  sleep 1
else
  echo "PostgreSQL already running"
fi

# Common env vars
export DATABASE_URL="postgresql://crm:crmpassword@127.0.0.1:5433/crm"
export NEXTAUTH_SECRET="dev-secret-change-in-production-32chars!!"
export NEXTAUTH_URL="http://localhost:3000"
export REDIS_URL="redis://localhost:6379"
export INTERNAL_SECRET="dev-internal-secret"
export WEB_APP_URL="http://localhost:3000"
export WHATSAPP_ENGINE_URL="http://localhost:3001"
export PUPPETEER_SKIP_DOWNLOAD="true"
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

# Start WhatsApp engine in background
echo "Starting WhatsApp engine at http://localhost:3001"
npm run dev:whatsapp &
WHATSAPP_PID=$!
echo "WhatsApp engine PID: $WHATSAPP_PID"

# Start Next.js dev server (foreground)
echo "Starting CRM dev server at http://localhost:3000"
npm run dev:web

# On exit, kill whatsapp engine
kill $WHATSAPP_PID 2>/dev/null
