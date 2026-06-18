@echo off
echo ========================================================
echo DayEx - Expense Tracker Setup and Start
echo ========================================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Setting up database...
call npm run setup
echo.
echo Starting servers...
call npm start
pause
