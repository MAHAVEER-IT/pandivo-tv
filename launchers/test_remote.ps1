$adb = "C:\Users\kanna\AppData\Local\Android\Sdk\platform-tools\adb.exe"
Write-Host "[1] Waking display..."
$null | & $adb -s emulator-5554 shell input keyevent 224
Write-Host "[2] Starting MainActivity..."
$null | & $adb -s emulator-5554 shell am start -n com.firetv.musicpoc/.MainActivity
Start-Sleep -Seconds 2
Write-Host "[3] Capturing screen..."
$null | & $adb -s emulator-5554 shell screencap -p /sdcard/tv_live.png
Write-Host "[4] Pulling screenshot..."
$null | & $adb -s emulator-5554 pull /sdcard/tv_live.png "c:\Users\kanna\OneDrive\Documents\AMAZON_HACK\TESTING\tv_live.png"
Write-Host "[DONE] Screenshot pulled successfully!"
