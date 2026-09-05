@echo off
setlocal
cd /d "%~dp0"
echo.
echo   ONE PROMPT, TWO WORLDS
echo.
echo   1. LASTLIGHT            - GPT-6 Astra / medium
echo   2. Last Light Lancer    - GPT-5.6 Sol / high
echo   Q. Quit
echo.
choice /c 12Q /n /m "Choose a game: "
if errorlevel 3 exit /b
if errorlevel 2 goto lancer
start "" "%~dp0games\lastlight\index.html"
exit /b
:lancer
start "" "%~dp0games\last-light-lancer\index.html"
exit /b
