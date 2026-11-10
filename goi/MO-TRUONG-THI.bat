@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Truong thi - DONG CUA SO NAY LA TAT GAME
echo.
echo   ===== AI LA TRANG NGUYEN - BAN QUET MA QR =====
echo.
rem Bam dup ngay trong file zip thi Windows giai nen tam vao AppData\Local\Temp: xoa chuoi do khoi duong dan, khac di la dang o trong zip
set "DUONG=%~dp0"
if /i not "%DUONG:\AppData\Local\Temp\=%"=="%DUONG%" goto trongzip
if not exist "node\node.exe" goto thieu
if not exist "node_modules\tsx\dist\cli.mjs" goto thieu
echo   Dang mo truong thi. Khoang 10-20 giay nua trinh duyet se tu mo.
echo   De cua so nay mo suot buoi choi. Dong cua so nay la tat game.
echo.
set NODE_ENV=production
set PORT=3017
set CHOI_PORT=3018
set MO_TRINH_DUYET=1
"node\node.exe" "node_modules\tsx\dist\cli.mjs" server.ts
echo.
echo   Game da tat. Neu thay chu EADDRINUSE o tren: game dang mo o cua so khac, dong cua so do roi bam lai.
pause
exit /b

:thieu
echo   Thieu file cua game. Hay giai nen CA file zip ra 1 thu muc (vi du C:\TrangNguyen) roi bam lai.
pause
exit /b

:trongzip
echo   Ban dang mo ngay trong file zip, game se khong chay.
echo   Chuot phai vao file zip, chon "Extract All" (Giai nen tat ca), roi mo thu muc vua giai nen.
pause
exit /b
