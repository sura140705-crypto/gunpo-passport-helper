@echo off
rem =========================================================
rem  Gunpo Minwon Form Helper - Kiosk Launcher
rem  Opens the local hub (index.html) in Chrome kiosk mode.
rem  No internet required. Runs fully offline from this folder.
rem =========================================================
setlocal

rem -- build file:// URL from this .bat's own folder --
set "P=%~dp0index.html"
set "P=%P:\=/%"

rem -- locate Chrome --
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo [!] Chrome not found. Please install Google Chrome, or edit CHROME path in this file.
  pause
  exit /b 1
)

rem -- kiosk mode: fullscreen, incognito (no history/traces), no swipe-back --
start "" "%CHROME%" --kiosk --incognito --overscroll-history-navigation=0 --disable-features=Translate "file:///%P%"

endlocal
