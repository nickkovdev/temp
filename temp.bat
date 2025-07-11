@echo off
::  download-unzip-open  (ASCII-only version)

setlocal enableextensions enabledelayedexpansion

:: ---- CONFIG ----
set "ZIPURL=https://raw.githubusercontent.com/nickkovdev/temp/main/code.zip"
set "ZIPFILE=%TEMP%\exam.zip"
set "DEST=%TEMP%\exam"
:: ----------------

echo [*] Cleaning previous temp folder
if exist "%DEST%" rd /s /q "%DEST%"
md "%DEST%" >nul 2>&1

:: ---------- DOWNLOAD ----------
echo [*] Trying built-in curl …
curl -L "%ZIPURL%" -o "%ZIPFILE%" 2>nul
if exist "%ZIPFILE%" goto :UNZIP

echo [!] curl failed – using BITS …
bitsadmin /transfer examDL /download /priority foreground "%ZIPURL%" "%ZIPFILE%"
if exist "%ZIPFILE%" goto :UNZIP

echo [!] BITS failed – using certutil …
certutil -urlcache -split -f "%ZIPURL%" "%ZIPFILE%" >nul
if not exist "%ZIPFILE%" (
    echo [x] All download methods failed. Aborting.
    pause
    goto :EOF
)

:UNZIP
echo [*] Unpacking …
tar -xf "%ZIPFILE%" -C "%DEST%" 2>nul || (
    echo [!] tar not available – using PowerShell Expand-Archive …
    powershell -nologo -noprofile -command ^
      "Expand-Archive -Path '%ZIPFILE%' -DestinationPath '%DEST%' -Force"
)

echo [*] Opening folder – drag the folder that contains manifest.json onto chrome://extensions
start "" explorer "%DEST%"

endlocal
