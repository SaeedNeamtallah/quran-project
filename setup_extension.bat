@echo off
chcp 65001 >nul
echo ========================================
echo   إعداد إضافة كروم — بومودورو قرآني
echo ========================================
echo.

set EXT_DIR=%~dp0chrome-extension
set SRC_DIR=%~dp0

echo [1/3] نسخ بيانات القرآن (8MB)...
if exist "%SRC_DIR%quran_offline.json" (
    copy /Y "%SRC_DIR%quran_offline.json" "%EXT_DIR%\quran_offline.json" >nul
    if errorlevel 1 (
        echo      ✗ تعذر نسخ quran_offline.json
        pause
        exit /b 1
    )
    echo      ✓ quran_offline.json
) else (
    echo      ✗ خطأ: quran_offline.json غير موجود!
    echo         شغّل أولاً: python download_quran.py
    pause
    exit /b
)

echo [2/3] نسخ ملف الصوت...
if exist "%SRC_DIR%static\alarm.m4a" (
    copy /Y "%SRC_DIR%static\alarm.m4a" "%EXT_DIR%\alarm.m4a" >nul
    if errorlevel 1 (
        echo      ⚠ تعذر نسخ alarm.m4a
    ) else (
        echo      ✓ alarm.m4a
    )
) else (
    echo      ⚠ alarm.m4a غير موجود — سيعمل بدون صوت
)

echo [3/3] إنشاء مجلد الأيقونات...
if not exist "%EXT_DIR%\icons" mkdir "%EXT_DIR%\icons"

:: Use PowerShell to resize the icon to 3 sizes
powershell -Command ^
  "$src = '%EXT_DIR%\icons\icon_src.png'; " ^
  "if (!(Test-Path $src)) { Write-Host 'No source icon found, using placeholder'; exit 0 }; " ^
  "Add-Type -AssemblyName System.Drawing; " ^
  "$img = [System.Drawing.Image]::FromFile($src); " ^
  "foreach ($size in 16,48,128) { " ^
  "  $bmp = New-Object System.Drawing.Bitmap($size, $size); " ^
  "  $g = [System.Drawing.Graphics]::FromImage($bmp); " ^
  "  $g.DrawImage($img, 0, 0, $size, $size); " ^
  "  $bmp.Save('%EXT_DIR%\icons\icon' + $size + '.png'); " ^
  "  $g.Dispose(); $bmp.Dispose() }; " ^
  "$img.Dispose()"

echo      ✓ المجلد جاهز

echo.
echo ========================================
echo   ✅ الإعداد مكتمل!
echo ========================================
echo.
echo الخطوات لتثبيت الإضافة في كروم:
echo   1. افتح كروم واذهب لـ: chrome://extensions
echo   2. فعّل "Developer mode" (أعلى اليمين)
echo   3. اضغط "Load unpacked"
echo   4. اختر المجلد: chrome-extension
echo.
echo المجلد موجود في:
echo   %EXT_DIR%
echo.
pause
