#!/bin/bash

# Load local .env for other variables
export $(cat ../.env | grep -v '^#' | xargs)

# Override DATABASE_URL with production (with SSL)
export DATABASE_URL="postgresql://whatsapp_postgres_50oh_user:CAXwE0dZPEJe82LAioj9E4UXPNsCA7TL@dpg-d4odtlre5dus73c6c6n0-a.oregon-postgres.render.com/whatsapp_postgres_50oh?sslmode=require"

# Run migrations
npm run migrate
