@echo off
cd /d %~dp0
echo Starting development server from %CD%
npm run dev
pause 