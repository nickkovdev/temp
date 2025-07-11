@echo off
setlocal EnableDelayedExpansion

REM ───────── CONFIG ─────────
set "ZIPURL=https://raw.githubusercontent.com/nickkovdev/temp/main/code.zip"
set "ZIPFILE=%TEMP%\exam.zip"
set "DEST=%TEMP%\exam"
REM ──────────────────────────

echo [*] Cleaning old temp folder
if exist "%DEST%" rmdir /s /q "%DEST%"
mkdir "%DEST%" >nul 2>&1

echo [*] Trying to download with built-in curl …
curl -L "%ZIPURL%" -o "%ZIPFILE%" 2>nul
if exist "%ZIPFILE%" goto :UNZIP

echo [!] curl failed, falling back to BITS …
bitsadmin /transfer examDL /download /priority foreground "%ZIPURL%" "%ZIPFILE%"
if exist "%ZIPFILE%" goto :UNZIP

echo [!] BITS failed, trying certutil …
certutil -urlcache -split -f "%ZIPURL%" "%ZIPFILE%" >nul
if not exist "%ZIPFILE%" (
    echo [×] All download methods failed. Aborting.
    pause
    goto :EOF
)

:UNZIP
echo [*] Unpacking …
tar -xf "%ZIPFILE%" -C "%DEST%"

echo [*] Opening folder — drag the one that contains manifest.json onto chrome://extensions
start "" explorer "%DEST%"
endlocal
