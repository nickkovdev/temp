@echo off
REM --- simple download → unzip → open ---

set "ZIPURL=https://raw.githubusercontent.com/nickkovdev/temp/main/code.zip"
set "DEST=%TEMP%\exam"

REM clean old copy
rd /s /q "%DEST%" 2>nul

REM download + unzip with PowerShell (present on every Win10/11)
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass ^
  -Command "Invoke-WebRequest '%ZIPURL%' -OutFile '%DEST%.zip';" ^
           "Expand-Archive '%DEST%.zip' '%DEST%' -Force"

start "" explorer "%DEST%"
