#!/bin/bash
echo "========================================================"
echo "DayEx - Expense Tracker Setup and Start"
echo "========================================================"
echo ""
echo "Installing dependencies..."
npm install
echo ""
echo "Setting up database..."
npm run setup
echo ""
echo "Starting servers..."
npm start
