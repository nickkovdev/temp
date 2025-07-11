@echo off
REM --- quickest local unpack of the ZIP at https://rb.gy/gryw7t ---

:: 1. put the URL in a variable (easy to change later)
set "ZIPURL=https://rb.gy/gryw7t"

:: 2. download + extract with PowerShell; ExecutionPolicy=Bypass
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass ^
  -Command "Invoke-WebRequest '%ZIPURL%' -OutFile \$env:TEMP\exam.zip; " ^
           "Expand-Archive -Path \$env:TEMP\exam.zip -DestinationPath \$env:TEMP\exam -Force; " ^
           "Start-Process explorer.exe \$env:TEMP\exam"
