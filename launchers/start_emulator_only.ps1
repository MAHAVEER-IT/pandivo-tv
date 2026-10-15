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

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$emulatorExe = "$sdkRoot\emulator\emulator.exe"
$emulatorDir = "$sdkRoot\emulator"
$cmdLine = "`"$emulatorExe`" -avd Television_1080p -gpu host"

$pidLaunched = [DesktopLauncher.Starter]::Launch($emulatorExe, $cmdLine, "WinSta0\Default", $emulatorDir)
Write-Output "Launched emulator with PID: $pidLaunched"
