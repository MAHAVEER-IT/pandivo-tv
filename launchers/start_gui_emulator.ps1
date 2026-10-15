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

        public static int Launch(string app, string cmd, string desktop, string dir) {
            STARTUPINFO si = new STARTUPINFO();
            si.cb = (uint)Marshal.SizeOf(si);
            si.lpDesktop = desktop;
            PROCESS_INFORMATION pi = new PROCESS_INFORMATION();
            bool ok = CreateProcess(app, cmd, IntPtr.Zero, IntPtr.Zero, false, 0, IntPtr.Zero, dir, ref si, out pi);
            if (!ok) {
                return -Marshal.GetLastWin32Error();
            }
            return (int)pi.dwProcessId;
        }
    }
}
"@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$emulatorExe = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$emulatorDir = "$env:LOCALAPPDATA\Android\Sdk\emulator"
$cmdLine = "`"$emulatorExe`" -avd Television_1080p -gpu host"

Write-Output "[1/6] Launching Android TV Emulator on user GUI desktop (WinSta0\Default)..."
$pidLaunched = [DesktopLauncher.Starter]::Launch($emulatorExe, $cmdLine, "WinSta0\Default", $emulatorDir)

if ($pidLaunched -le 0) {
    Write-Error "Failed to launch emulator. Error code: $pidLaunched"
    exit 1
}

Write-Output "[2/6] Emulator launcher started with PID: $pidLaunched. Waiting for device detection..."

# Give emulator 5 seconds to spawn qemu
Start-Sleep -Seconds 5

# Locate qemu process
$qemu = Get-Process -Name "qemu-system-x86_64" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($qemu) {
    Write-Output "Detected QEMU system process: PID $($qemu.Id)"
} else {
    Write-Output "Waiting for QEMU process..."
}

# Wait for ADB
$adb = "adb"
& $adb wait-for-device
Write-Output "[3/6] Device detected via ADB! Waiting for system boot to complete..."

$bootCompleted = $false
for ($i = 0; $i -lt 40; $i++) {
    $res = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
    if ($res -eq "1") {
        $bootCompleted = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($bootCompleted) {
    Write-Output "[4/6] Android TV system boot completed successfully!"
} else {
    Write-Output "[WARN] Boot completion check timed out, attempting to continue..."
}

Write-Output "[5/6] Reversing Metro bundler port 8081..."
& $adb reverse tcp:8081 tcp:8081

$apkPath = "$PSScriptRoot\FireTVMusicPOC\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Output "Installing updated Fire TV Music APK with Whistle engine..."
    & $adb install -r $apkPath
    Write-Output "Granting app permissions..."
    & $adb shell pm grant com.firetv.musicpoc android.permission.RECORD_AUDIO 2>$null
    & $adb shell pm grant com.firetv.musicpoc android.permission.READ_EXTERNAL_STORAGE 2>$null
    & $adb shell pm grant com.firetv.musicpoc android.permission.READ_MEDIA_AUDIO 2>$null
}

Write-Output "[6/6] Launching Fire TV Music Application..."
& $adb shell input keyevent 224
& $adb shell input keyevent 82
& $adb shell am start -n com.firetv.musicpoc/.MainActivity

Write-Output "App launched! Waiting 6 seconds for bundle loading..."
Start-Sleep -Seconds 6
& $adb shell screencap -p /sdcard/tv_live.png
& $adb pull /sdcard/tv_live.png "c:\Users\kanna\OneDrive\Documents\AMAZON_HACK\TESTING\tv_live.png"

Write-Output "App is active and running interactively on the user desktop."

# Keep this script running so the emulator process tree stays alive in the background
if ($qemu) {
    Wait-Process -Id $qemu.Id
} else {
    $qemuRetry = Get-Process -Name "qemu-system-x86_64" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($qemuRetry) {
        Wait-Process -Id $qemuRetry.Id
    } else {
        Start-Sleep -Seconds 3600
    }
}
