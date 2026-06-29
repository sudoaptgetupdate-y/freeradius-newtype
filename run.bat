@echo off
npx -y concurrently -k "npm run dev --prefix backend" "npm run dev --prefix frontend"
pause
