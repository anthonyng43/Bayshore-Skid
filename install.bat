@echo off
rmdir dist /s /q
rmdir node_modules /s /q
npm i & npm run build_protos & npx prisma generate & npm run build_ts
pause
exit