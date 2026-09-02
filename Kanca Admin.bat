@echo off
title Kanca Insaat - Yonetim Paneli
cd /d "%~dp0"
echo.
echo  Yonetim paneli baslatiliyor, lutfen bekleyin...
echo  Tarayici otomatik acilacaktir.
echo.
echo  Paneli kapatmak icin bu pencereyi kapatin.
echo.
start "" cmd /c "timeout /t 5 /nobreak >nul & start "" http://localhost:5199/admin"
npm run admin
