@echo off
echo ==========================================
echo    PDF Analyzer ^& Summarizer
echo ==========================================
echo.
echo Starting the app...
echo.
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev
