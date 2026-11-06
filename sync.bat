@echo off
echo ===================================================
echo   Menjalankan Sinkronisasi Kode (GitHub & Apps Script)
echo ===================================================
echo.

echo [1/2] Mengirim data ke GitHub...
git add .
git commit -m "update otomatis"
git push

echo.
echo [2/2] Mengirim data ke Google Apps Script...
clasp push

echo.
echo ===================================================
echo   STATUS: SINKRONISASI SELESAI 100%!
echo   Silakan periksa pesan di atas untuk memastikan 
echo   tidak ada error pada Git maupun Clasp.
echo ===================================================
echo.
pause