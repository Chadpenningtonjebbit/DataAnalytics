@echo off
cd /d %~dp0
echo Starting development server on port 3000 from %CD%
npx next dev -p 3000
pause 