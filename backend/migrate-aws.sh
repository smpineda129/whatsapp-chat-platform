#!/bin/bash

# Migrate to AWS RDS database
export DATABASE_URL="postgresql://postgres:jODOY3aqyuvvJ4TwP3ms@db-whatsapp.cpo4wotv7yic.us-east-2.rds.amazonaws.com:5432/whatsapp"

# Run migrations
npm run migrate
