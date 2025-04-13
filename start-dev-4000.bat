@echo off
cd /d %~dp0
echo Starting development server on port 4000 from %CD%
npx next dev -p 4000
pause 