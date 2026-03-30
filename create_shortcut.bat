@echo off
chcp 65001 >nul
echo Creating desktop shortcut...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Quranic Pomodoro.lnk')); $s.TargetPath = '%~dp0start.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Quranic Pomodoro Timer'; $s.Save()"

echo.
echo Done! Shortcut created on Desktop.
pause
