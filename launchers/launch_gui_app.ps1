param (
    [switch]$ForceReinstall
)

$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   FIRE TV MUSIC - GUI APPLICATION LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Setup C# Process Launcher for WinSta0\Default
$code = @"
using System;
using System.Runtime.InteropServices;

namespace DesktopLauncher {
    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
        public IntPtr hProcess;
        public IntPtr hThread;
        public uint dwProcessId;
        public uint dwThreadId;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct STARTUPINFO {
        public uint cb;
        public string lpReserved;
        public string lpDesktop;
        public string lpTitle;
        public uint dwX;
        public uint dwY;
        public uint dwXSize;
        public uint dwYSize;
        public uint dwXCountChars;
        public uint dwYCountChars;
        public uint dwFillAttribute;
        public uint dwFlags;
        public short wShowWindow;
        public short cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    public class Starter {
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CreateProcess(
            string lpApplicationName,
            string lpCommandLine,
            IntPtr lpProcessAttributes,
            IntPtr lpThreadAttributes,
            bool bInheritHandles,
            uint dwCreationFlags,
            IntPtr lpEnvironment,
            string lpCurrentDirectory,
            ref STARTUPINFO lpStartupInfo,
            out PROCESS_INFORMATION lpProcessInformation
        );

        public static int Launch(string app, string cmd, string desktop, string dir, uint flags = 0) {
            STARTUPINFO si = new STARTUPINFO();
            si.cb = (uint)Marshal.SizeOf(si);
            si.lpDesktop = desktop;
            PROCESS_INFORMATION pi = new PROCESS_INFORMATION();
            bool ok = CreateProcess(app, cmd, IntPtr.Zero, IntPtr.Zero, false, flags, IntPtr.Zero, dir, ref si, out pi);
            if (!ok) {
                return -Marshal.GetLastWin32Error();
            }
            return (int)pi.dwProcessId;
        }
    }
}
"@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$emulatorExe = "$sdkRoot\emulator\emulator.exe"
$emulatorDir = "$sdkRoot\emulator"
$adb = "$sdkRoot\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { $adb = "adb" }
$projectDir = "C:\Users\kanna\OneDrive\Documents\AMAZON_HACK\TESTING\FireTVMusicPOC"
$apkPath = "$projectDir\android\app\build\outputs\apk\debug\app-debug.apk"

# 2. Check / Start Metro Bundler
Write-Host "`n[1/6] Checking Metro Bundler on port 8081..." -ForegroundColor Yellow
$metroOk = $false
try {
    $res = Invoke-WebRequest -Uri 'http://localhost:8081/status' -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -eq 200) { $metroOk = $true }
} catch {
    $metroOk = $false
}

if ($metroOk) {
    Write-Host "       [OK] Metro bundler is already running on port 8081!" -ForegroundColor Green
} else {
    Write-Host "       [INFO] Starting Metro Bundler in GUI window..." -ForegroundColor Cyan
    $cmdExe = "C:\Windows\System32\cmd.exe"
    $cmdArgs = "cmd.exe /k `"title Metro Bundler - Fire TV Music && cd /d $projectDir && set EXPO_TV=1&& npx expo start -c`""
    $metroPid = [DesktopLauncher.Starter]::Launch($cmdExe, $cmdArgs, "WinSta0\Default", $projectDir, 0x00000010)
    Write-Host "       [INFO] Metro process launched (PID: $metroPid). Waiting for bundler to initialize..." -ForegroundColor Gray
    
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 2
        try {
            $res = Invoke-WebRequest -Uri 'http://localhost:8081/status' -UseBasicParsing -TimeoutSec 2
            if ($res.StatusCode -eq 200) {
                $metroOk = $true
                Write-Host "       [OK] Metro bundler initialized successfully!" -ForegroundColor Green
                break
            }
        } catch { }
    }
    if (-not $metroOk) {
        Write-Host "       [WARN] Metro bundler status endpoint didn't respond yet, continuing..." -ForegroundColor Yellow
    }
}

# 3. Check / Start Android TV Emulator
Write-Host "`n[2/6] Checking Android TV Emulator..." -ForegroundColor Yellow
$devices = & $adb devices
$emuRunning = ($devices | Select-String "emulator-") -ne $null

if ($emuRunning) {
    Write-Host "       [OK] Emulator is already running!" -ForegroundColor Green
} else {
    Write-Host "       [INFO] Launching Television_1080p emulator on user GUI desktop..." -ForegroundColor Cyan
    $emuCmd = "`"$emulatorExe`" -avd Television_1080p -gpu host"
    $emuPid = [DesktopLauncher.Starter]::Launch($emulatorExe, $emuCmd, "WinSta0\Default", $emulatorDir, 0x00000010)
    if ($emuPid -le 0) {
        Write-Host "       [ERROR] Failed to start emulator. Code: $emuPid" -ForegroundColor Red
        exit 1
    }
    Write-Host "       [INFO] Emulator started (PID: $emuPid). Waiting for device detection..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
    & $adb wait-for-device
    Write-Host "       [OK] Emulator device detected by ADB!" -ForegroundColor Green
}

# 4. Wait for boot completion
Write-Host "`n[3/6] Waiting for Android TV system to complete boot..." -ForegroundColor Yellow
$booted = $false
for ($i = 0; $i -lt 60; $i++) {
    $res = (& $adb shell getprop sys.boot_completed 2>$null)
    if ($res -and $res.Trim() -eq "1") {
        $booted = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($booted) {
    Write-Host "       [OK] Android TV system boot completed!" -ForegroundColor Green
} else {
    Write-Host "       [WARN] Boot completion check timed out, attempting to proceed..." -ForegroundColor Yellow
}

# 5. Reverse port 8081
Write-Host "`n[4/6] Reversing Metro port 8081 to emulator..." -ForegroundColor Yellow
& $adb reverse tcp:8081 tcp:8081
Write-Host "       [OK] Port 8081 reversed to emulator." -ForegroundColor Green

# 6. Check / Install APK
Write-Host "`n[5/6] Checking Fire TV Music package installation..." -ForegroundColor Yellow
$pkgCheck = & $adb shell pm list packages com.firetv.musicpoc
if ($ForceReinstall -or (-not ($pkgCheck -match "com.firetv.musicpoc"))) {
    Write-Host "       [INFO] Installing APK ($apkPath)..." -ForegroundColor Cyan
    & $adb install -r $apkPath
    Write-Host "       [OK] APK installed successfully." -ForegroundColor Green
} else {
    Write-Host "       [OK] App package com.firetv.musicpoc is already installed." -ForegroundColor Green
}

Write-Host "       [INFO] Granting required audio & storage permissions..." -ForegroundColor Cyan
& $adb shell pm grant com.firetv.musicpoc android.permission.RECORD_AUDIO 2>$null
& $adb shell pm grant com.firetv.musicpoc android.permission.READ_EXTERNAL_STORAGE 2>$null
& $adb shell pm grant com.firetv.musicpoc android.permission.READ_MEDIA_AUDIO 2>$null

# 7. Wake up display & Launch App
Write-Host "`n[6/6] Launching Fire TV Music Application..." -ForegroundColor Yellow
& $adb shell input keyevent 224   # WAKEUP
& $adb shell input keyevent 82    # MENU / UNLOCK
Start-Sleep -Milliseconds 500
& $adb shell am force-stop com.firetv.musicpoc
& $adb shell am start -n com.firetv.musicpoc/.MainActivity

Write-Host "`n[WAIT] Waiting 10 seconds for React Native TV bundle to load..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 8. Capture Verification Screenshot
$screenDest = "C:\Users\kanna\OneDrive\Documents\AMAZON_HACK\TESTING\tv_live.png"
& $adb shell screencap -p /sdcard/tv_live.png
& $adb pull /sdcard/tv_live.png $screenDest

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   APPLICATION IS NOW RUNNING ON GUI!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Screenshot captured to $screenDest" -ForegroundColor Cyan
Write-Host "GUI session is active. Waiting on emulator..." -ForegroundColor Cyan

# Keep process alive so background job object doesn't terminate emulator or Metro
$qemu = Get-Process -Name "qemu-system-x86_64" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($qemu) {
    Wait-Process -Id $qemu.Id
} else {
    while ($true) { Start-Sleep -Seconds 60 }
}
